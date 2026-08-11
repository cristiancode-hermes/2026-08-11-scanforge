import { Component, computed, inject, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Tag } from '../interfaces/models';
import { ColorPickerComponent } from './color-picker.component';
import { QrPreviewComponent } from './qr-preview.component';

/**
 * Formulario compartido create/edit: título, URL, slug, colores, estilo y tags.
 * El preview se regenera con debounce 200ms.
 */
@Component({
  selector: 'app-qr-form',
  standalone: true,
  imports: [FormsModule, ColorPickerComponent, QrPreviewComponent],
  template: `
    <div class="form-grid">
      <div class="form-section">
        <div>
          <label class="label" for="title">Título</label>
          <input id="title" class="input" [(ngModel)]="title" name="title" maxlength="80" placeholder="Menú digital terraza" />
          <p class="field-hint">{{ title().length }}/80</p>
        </div>

        <div>
          <label class="label" for="targetUrl">URL destino</label>
          <input id="targetUrl" class="input" [(ngModel)]="targetUrl" name="targetUrl" placeholder="https://cafeteria.example.com/menu" />
          @if (targetUrl() && !urlValid()) {
            <p class="field-error">Debe ser una URL válida con http(s)://</p>
          }
        </div>

        <div>
          <label class="label" for="slug">Slug corto</label>
          <div style="display: flex; gap: 8px; align-items: center;">
            <div style="display: flex; align-items: center; border: 1px solid var(--color-border); border-radius: 6px; overflow: hidden; flex: 1;">
              <span style="padding: 0 10px; font-family: var(--font-mono); font-size: 13px; color: var(--color-muted); background: var(--color-surface-hover); align-self: stretch; display: flex; align-items: center;">/r/</span>
              <input
                id="slug"
                class="input"
                style="border: none; box-shadow: none; border-radius: 0;"
                [(ngModel)]="slug"
                name="slug"
                [readonly]="!slugEditable()"
                [attr.aria-label]="'Slug del código'"
                pattern="[a-z0-9]{4,12}"
              />
            </div>
            <button type="button" class="btn btn-secondary btn-sm" (click)="regenerateSlug()" title="Generar nuevo slug">↻</button>
          </div>
          @if (slugConflict()) {
            <p class="field-error">Slug '{{ slug() }}' is already taken</p>
          }
          @if (slug() && !slugValid()) {
            <p class="field-error">4–12 caracteres [a-z0-9]</p>
          }
        </div>

        <div>
          <label class="label">Color de módulos (frente)</label>
          <app-color-picker [(value)]="foregroundColor" />
        </div>

        <div>
          <label class="label">Fondo</label>
          <app-color-picker [(value)]="backgroundColor" [presets]="bgPresets" />
        </div>

        <div>
          <label class="label" for="style">Estilo</label>
          <select id="style" class="input" [(ngModel)]="style" name="style">
            <option value="classic">Clásico</option>
            <option value="dots">Puntos</option>
            <option value="rounded">Redondeado</option>
          </select>
        </div>

        <div>
          <label class="label">Etiquetas</label>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            @for (tag of tags(); track tag.id) {
              <button
                type="button"
                class="tag-chip"
                [class.selected]="selectedTagIds().includes(tag.id)"
                (click)="toggleTag(tag.id)"
                [style.borderColor]="tag.color"
              >
                <span style="width: 8px; height: 8px; border-radius: 50%; background: {{ tag.color }}; display: inline-block;"></span>
                {{ tag.name }}
              </button>
            }
            @if (tags().length === 0) {
              <span style="font-size: 12px; color: var(--color-muted);">Crea etiquetas en la sección Etiquetas</span>
            }
          </div>
        </div>
      </div>

      <div>
        <label class="label" style="margin-bottom: 12px;">Vista previa</label>
        <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 12px;">
          <app-qr-preview [value]="previewValue()" [foregroundColor]="foregroundColor()" [backgroundColor]="backgroundColor()" [size]="200" />
          <div class="mono-sm" style="color: var(--color-graphite);">/r/{{ slug() || '…' }}</div>
          @if (contrastWarning()) {
            <p class="field-error" style="max-width: 260px;">Contraste bajo ({{ contrastWarning() }}:1) — el QR podría no escanearse impreso. Usa un fondo claro con módulos oscuros.</p>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tag-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      border: 1px solid var(--color-border);
      background: transparent;
      color: var(--color-ink);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: background 100ms ease-out;
      min-height: 30px;
    }
    .tag-chip:hover { background: var(--color-surface-hover); }
    .tag-chip.selected { background: var(--color-accent-soft); border-color: var(--color-accent); }
  `],
})
export class QrFormComponent {
  readonly title = model('');
  readonly targetUrl = model('');
  readonly slug = model('');
  readonly slugEditable = input(true);
  readonly foregroundColor = model('#16181D');
  readonly backgroundColor = model('#FFFFFF');
  readonly style = model<'classic' | 'dots' | 'rounded'>('classic');
  readonly tags = input<Tag[]>([]);
  readonly selectedTagIds = model<string[]>([]);
  readonly slugConflict = input(false);

  protected readonly bgPresets = ['#FFFFFF', '#F6F7F9', '#DDF1F7', '#FFFBEB', '#FEF2F2', '#F0FDF4', '#16181D'];

  protected readonly urlValid = computed(() => /^https?:\/\/.+\..+/.test(this.targetUrl()));
  protected readonly slugValid = computed(() => /^[a-z0-9]{4,12}$/.test(this.slug()));
  protected readonly previewValue = computed(() => `/api/r/${this.slug() || 'slug'}`);
  protected readonly contrastWarning = computed(() => {
    const fg = this.foregroundColor();
    const bg = this.backgroundColor();
    if (!/^#[0-9a-fA-F]{6}$/.test(fg) || !/^#[0-9a-fA-F]{6}$/.test(bg)) return '';
    const ratio = this.contrastRatio(fg, bg);
    return ratio < 3 ? ratio.toFixed(1) : '';
  });

  protected toggleTag(id: string): void {
    this.selectedTagIds.update((ids) =>
      ids.includes(id) ? ids.filter((t) => t !== id) : [...ids, id],
    );
  }

  protected regenerateSlug(): void {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let out = '';
    const rand = new Uint8Array(6);
    crypto.getRandomValues(rand);
    for (const b of rand) out += chars[b % chars.length];
    this.slug.set(out);
  }

  private contrastRatio(fg: string, bg: string): number {
    const lum = (hex: string): number => {
      const c = hex.replace('#', '');
      const [r, g, b] = [0, 2, 4].map((i) => {
        const v = parseInt(c.slice(i, i + 2), 16) / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const l1 = lum(fg);
    const l2 = lum(bg);
    const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
    return (hi + 0.05) / (lo + 0.05);
  }
}
