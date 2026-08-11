import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { QrCodesService } from '../../services/qr-codes.service';
import { TagsService } from '../../services/tags.service';
import { ToastService } from '../../services/toast.service';
import { QRCode } from '../../interfaces/models';
import { QrFormComponent } from '../../shared/qr-form.component';
import { SkeletonComponent } from '../../shared/skeleton.component';

@Component({
  selector: 'app-qr-edit-page',
  standalone: true,
  imports: [RouterLink, QrFormComponent, SkeletonComponent],
  template: `
    @if (!qr()) {
      <app-skeleton [rows]="4" />
    } @else {
      <div class="page-header">
        <div>
          <a [routerLink]="['/codes', qr()!.id]" style="font-size: 13px; color: var(--color-graphite);">← Volver al detalle</a>
          <h1 class="page-title" style="margin-top: 4px;">Editar código</h1>
          <p class="page-subtitle">El slug no se puede cambiar: los QR impresos seguirán funcionando</p>
        </div>
      </div>

      <div class="card" style="padding: 24px;">
        <app-qr-form
          [(title)]="title"
          [(targetUrl)]="targetUrl"
          [(slug)]="slug"
          [slugEditable]="false"
          [(foregroundColor)]="foregroundColor"
          [(backgroundColor)]="backgroundColor"
          [(style)]="style"
          [tags]="tags.tags()"
          [(selectedTagIds)]="selectedTagIds"
        />

        @if (serverError()) {
          <div style="background: rgba(220,38,38,0.08); color: var(--color-danger); border-radius: 6px; padding: 10px 12px; font-size: 13px; margin-top: 16px;">
            {{ serverError() }}
          </div>
        }

        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px; border-top: 1px solid var(--color-border); padding-top: 16px;">
          <button class="btn btn-secondary" [routerLink]="['/codes', qr()!.id]">Cancelar</button>
          <button class="btn btn-primary" [disabled]="saving() || !formValid()" (click)="save()">
            {{ saving() ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </div>
      </div>
    }
  `,
})
export class QrEditPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly qrCodes = inject(QrCodesService);
  readonly tags = inject(TagsService);
  private readonly toast = inject(ToastService);

  protected readonly qr = signal<QRCode | null>(null);
  protected readonly title = signal('');
  protected readonly targetUrl = signal('');
  protected readonly slug = signal('');
  protected readonly foregroundColor = signal('#16181D');
  protected readonly backgroundColor = signal('#FFFFFF');
  protected readonly style = signal<'classic' | 'dots' | 'rounded'>('classic');
  protected readonly selectedTagIds = signal<string[]>([]);
  protected readonly saving = signal(false);
  protected readonly serverError = signal('');

  protected readonly formValid = computed(() => {
    return this.title().trim().length >= 1 && /^https?:\/\/.+\..+/.test(this.targetUrl());
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      void this.router.navigate(['/codes']);
      return;
    }
    void this.load(id);
  }

  private async load(id: string): Promise<void> {
    try {
      const qr = await this.qrCodes.get(id);
      this.qr.set(qr);
      this.title.set(qr.title);
      this.targetUrl.set(qr.targetUrl);
      this.slug.set(qr.slug);
      this.foregroundColor.set(qr.foregroundColor);
      this.backgroundColor.set(qr.backgroundColor);
      this.style.set(qr.style);
      this.selectedTagIds.set(qr.tags.map((t) => t.id));
    } catch {
      this.toast.error('Código no encontrado');
      void this.router.navigate(['/codes']);
      return;
    }
    void this.tags.load();
  }

  protected async save(): Promise<void> {
    const qr = this.qr();
    if (!qr || !this.formValid() || this.saving()) return;
    this.saving.set(true);
    this.serverError.set('');
    try {
      await this.qrCodes.update(qr.id, {
        title: this.title().trim(),
        targetUrl: this.targetUrl().trim(),
        foregroundColor: this.foregroundColor(),
        backgroundColor: this.backgroundColor(),
        style: this.style(),
      });
      // Guardar tags si cambiaron
      const current = new Set(qr.tags.map((t) => t.id));
      const next = new Set(this.selectedTagIds());
      if (current.size !== next.size || [...current].some((id) => !next.has(id))) {
        await this.qrCodes.setTags(qr.id, this.selectedTagIds());
      }
      this.toast.success('Guardado ✓');
      await this.router.navigate(['/codes', qr.id]);
    } catch (err: any) {
      const msg = err?.error?.message ?? '';
      this.serverError.set(msg.includes('contrast') ? msg : 'No se pudo guardar');
    } finally {
      this.saving.set(false);
    }
  }
}
