import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { QrCodesService } from '../../services/qr-codes.service';
import { TagsService } from '../../services/tags.service';
import { ToastService } from '../../services/toast.service';
import { QrFormComponent } from '../../shared/qr-form.component';

@Component({
  selector: 'app-qr-create-page',
  standalone: true,
  imports: [QrFormComponent],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Nuevo código QR</h1>
        <p class="page-subtitle">Convierte una URL en un QR medible</p>
      </div>
      <button class="btn btn-secondary" (click)="goBack()">Cancelar</button>
    </div>

    <div class="card" style="padding: 24px;">
      <app-qr-form
        [(title)]="title"
        [(targetUrl)]="targetUrl"
        [(slug)]="slug"
        [(foregroundColor)]="foregroundColor"
        [(backgroundColor)]="backgroundColor"
        [(style)]="style"
        [tags]="tags.tags()"
        [(selectedTagIds)]="selectedTagIds"
        [slugConflict]="slugConflict()"
      />

      @if (serverError()) {
        <div style="background: rgba(220,38,38,0.08); color: var(--color-danger); border-radius: 6px; padding: 10px 12px; font-size: 13px; margin-top: 16px;">
          {{ serverError() }}
        </div>
      }

      <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px; border-top: 1px solid var(--color-border); padding-top: 16px;">
        <button class="btn btn-primary" [disabled]="saving() || !formValid()" (click)="save()">
          {{ saving() ? 'Creando…' : 'Crear código' }}
        </button>
      </div>
    </div>
  `,
})
export class QrCreatePageComponent implements OnInit {
  private readonly qrCodes = inject(QrCodesService);
  readonly tags = inject(TagsService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly title = signal('');
  protected readonly targetUrl = signal('');
  protected readonly slug = signal('');
  protected readonly foregroundColor = signal('#16181D');
  protected readonly backgroundColor = signal('#FFFFFF');
  protected readonly style = signal<'classic' | 'dots' | 'rounded'>('classic');
  protected readonly selectedTagIds = signal<string[]>([]);
  protected readonly saving = signal(false);
  protected readonly slugConflict = signal(false);
  protected readonly serverError = signal('');

  protected readonly formValid = computed(() => {
    return this.title().trim().length >= 1
      && /^https?:\/\/.+\..+/.test(this.targetUrl())
      && /^[a-z0-9]{4,12}$/.test(this.slug());
  });

  ngOnInit(): void {
    if (!this.slug()) {
      this.generateSlug();
    }
    void this.tags.load();
  }

  protected async save(): Promise<void> {
    if (!this.formValid() || this.saving()) return;
    this.saving.set(true);
    this.slugConflict.set(false);
    this.serverError.set('');
    try {
      const qr = await this.qrCodes.create({
        title: this.title().trim(),
        targetUrl: this.targetUrl().trim(),
        slug: this.slug(),
        foregroundColor: this.foregroundColor(),
        backgroundColor: this.backgroundColor(),
        style: this.style(),
        tagIds: this.selectedTagIds(),
      });
      this.toast.success('Código creado');
      await this.router.navigate(['/codes', qr.id]);
    } catch (err: any) {
      const msg = err?.error?.message ?? '';
      if (msg.includes('already taken')) {
        this.slugConflict.set(true);
      } else if (msg.includes('contrast')) {
        this.serverError.set(msg);
      } else {
        this.serverError.set('No se pudo crear el código. Revisa los campos.');
      }
    } finally {
      this.saving.set(false);
    }
  }

  private generateSlug(): void {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let out = '';
    const rand = new Uint8Array(6);
    crypto.getRandomValues(rand);
    for (const b of rand) out += chars[b % chars.length];
    this.slug.set(out);
  }

  protected goBack(): void {
    void this.router.navigate(['/codes']);
  }
}
