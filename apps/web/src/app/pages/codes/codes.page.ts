import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { QrCodesService } from '../../services/qr-codes.service';
import { TagsService } from '../../services/tags.service';
import { DashboardService } from '../../services/dashboard.service';
import { ToastService } from '../../services/toast.service';
import { QRCode, Tag } from '../../interfaces/models';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { SkeletonComponent } from '../../shared/skeleton.component';
import { ConfirmModalComponent } from '../../shared/confirm-modal.component';
import { BadgeComponent } from '../../shared/badge.component';

@Component({
  selector: 'app-codes-page',
  standalone: true,
  imports: [DatePipe, RouterLink, FormsModule, EmptyStateComponent, SkeletonComponent, ConfirmModalComponent, BadgeComponent],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Códigos QR</h1>
        <p class="page-subtitle">{{ codes.total() }} códigos creados</p>
      </div>
      <a routerLink="/codes/new" class="btn btn-primary">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        Nuevo código
      </a>
    </div>

    @if (dashboard.stats()) {
      <div class="kpi-grid" style="margin-bottom: 24px;">
        <div class="card">
          <div class="kpi-label">Total códigos</div>
          <div class="kpi-value">{{ dashboard.stats()!.totalCodes }}</div>
        </div>
        <div class="card">
          <div class="kpi-label">Total escaneos</div>
          <div class="kpi-value">{{ dashboard.stats()!.totalScans }}</div>
        </div>
        <div class="card">
          <div class="kpi-label">Escaneos últimos 7 días</div>
          <div class="kpi-value">{{ dashboard.stats()!.scansLast7d }}</div>
        </div>
        <div class="card">
          <div class="kpi-label">Media / día</div>
          <div class="kpi-value">{{ dashboard.stats()!.avgPerDay7d.toFixed(1) }}</div>
        </div>
      </div>
    }

    <div class="filters-bar">
      <input
        class="input"
        placeholder="Buscar por título o URL…"
        [(ngModel)]="search"
        (ngModelChange)="onSearchChange()"
        style="max-width: 320px;"
        aria-label="Buscar códigos"
      />
      <select class="input" [(ngModel)]="selectedTagId" (ngModelChange)="reload()" style="max-width: 200px;" aria-label="Filtrar por etiqueta">
        <option value="">Todas las etiquetas</option>
        @for (tag of tags.tags(); track tag.id) {
          <option [value]="tag.id">{{ tag.name }}</option>
        }
      </select>
      <select class="input" [(ngModel)]="sortBy" (ngModelChange)="reload()" style="max-width: 180px;" aria-label="Ordenar">
        <option value="createdAt">Fecha de creación</option>
        <option value="scanCount">Número de escaneos</option>
      </select>
    </div>

    @if (codes.loading()) {
      <app-skeleton [rows]="4" />
    } @else if (codes.error()) {
      <div class="card" style="display: flex; align-items: center; justify-content: space-between;">
        <span style="color: var(--color-danger);">{{ codes.error() }}</span>
        <button class="btn btn-secondary" (click)="reload()">Reintentar</button>
      </div>
    } @else if (codes.codes().length === 0 && hasFilters()) {
      <app-empty-state icon="◇" title="Sin resultados" message="No hay códigos que coincidan con tu búsqueda o filtros." actionLabel="Limpiar filtros" (action)="clearFilters()" />
    } @else if (codes.codes().length === 0) {
      <app-empty-state icon="▦" title="Crea tu primer código QR" message="Convierte cualquier URL en un QR medible: descárgalo, imprímelo y sigue sus escaneos." actionLabel="Crear código" (action)="goCreate()" />
    } @else {
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Slug</th>
              <th>Destino</th>
              <th>Etiquetas</th>
              <th>Escaneos</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (qr of codes.codes(); track qr.id) {
              <tr>
                <td>
                  <a [routerLink]="['/codes', qr.id]" style="font-weight: 500; color: var(--color-ink);">{{ qr.title }}</a>
                  <div style="font-size: 12px; color: var(--color-muted);">{{ qr.createdAt | date:'dd MMM yyyy' }}</div>
                </td>
                <td><span class="mono-sm">{{ '/r/' + qr.slug }}</span></td>
                <td style="max-width: 220px;">
                  <span style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" [title]="qr.targetUrl">{{ qr.targetUrl }}</span>
                </td>
                <td>
                  <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                    @for (tag of qr.tags; track tag.id) {
                      <app-badge [name]="tag.name" [color]="tag.color" />
                    }
                  </div>
                </td>
                <td><span class="mono">{{ qr.scanCount }}</span></td>
                <td>
                  <span class="status-pill" [class.active]="qr.isActive" [class.inactive]="!qr.isActive">
                    <span class="dot"></span>
                    {{ qr.isActive ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td style="text-align: right; white-space: nowrap;">
                  <button class="btn btn-ghost btn-icon" [attr.aria-label]="qr.isActive ? 'Desactivar' : 'Activar'" title="Activar / desactivar" (click)="toggleActive(qr)">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><rect x="2" y="6" width="20" height="12" rx="1" fill="var(--color-surface)"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
                  </button>
                  <button class="btn btn-ghost btn-icon" aria-label="Duplicar" title="Duplicar" (click)="duplicate(qr)">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </button>
                  <button class="btn btn-ghost btn-icon" style="color: var(--color-danger);" aria-label="Eliminar" title="Eliminar" (click)="askDelete(qr)">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (totalPages() > 1) {
        <div style="display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 16px;">
          <button class="btn btn-secondary btn-sm" (click)="goPage(page() - 1)" [disabled]="page() <= 1">Anterior</button>
          <span class="mono-sm" style="color: var(--color-graphite);">Página {{ page() }} de {{ totalPages() }}</span>
          <button class="btn btn-secondary btn-sm" (click)="goPage(page() + 1)" [disabled]="page() >= totalPages()">Siguiente</button>
        </div>
      }
    }

    <app-confirm-modal
      [visible]="showDelete()"
      title="Eliminar código"
      [message]="deleteMessage()"
      confirmLabel="Eliminar"
      [danger]="true"
      (confirm)="doDelete()"
      (cancel)="showDelete.set(false)"
    />
  `,
})
export class CodesPageComponent implements OnInit {
  readonly codes = inject(QrCodesService);
  readonly tags = inject(TagsService);
  readonly dashboard = inject(DashboardService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly search = signal('');
  protected readonly selectedTagId = signal('');
  protected readonly sortBy = signal('createdAt');
  protected readonly page = signal(1);
  protected readonly limit = 12;

  protected readonly showDelete = signal(false);
  protected readonly qrToDelete = signal<QRCode | null>(null);

  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.codes.total() / this.limit)));
  protected readonly deleteMessage = computed(() => {
    const qr = this.qrToDelete();
    if (!qr) return '';
    return qr.isActive
      ? `¿Seguro que quieres eliminar "${qr.title}"? Los QR impresos dejarán de funcionar y sus escaneos se borrarán.`
      : `¿Seguro que quieres eliminar "${qr.title}"? Se perderá todo su historial de escaneos.`;
  });

  ngOnInit(): void {
    void this.tags.load();
    void this.dashboard.load();
    void this.reload();
  }

  protected onSearchChange(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.page.set(1);
      void this.reload();
    }, 300);
  }

  protected async reload(): Promise<void> {
    try {
      await this.codes.load({
        search: this.search() || undefined,
        tagId: this.selectedTagId() || undefined,
        sort: this.sortBy() as 'createdAt' | 'scanCount',
        page: this.page(),
        limit: this.limit,
      });
    } catch {
      // error ya seteado en el service
    }
  }

  protected hasFilters(): boolean {
    return !!this.search() || !!this.selectedTagId();
  }

  protected clearFilters(): void {
    this.search.set('');
    this.selectedTagId.set('');
    this.page.set(1);
    void this.reload();
  }

  protected goPage(p: number): void {
    this.page.set(p);
    void this.reload();
  }

  protected async toggleActive(qr: QRCode): Promise<void> {
    await this.codes.toggleActive(qr);
  }

  protected async duplicate(qr: QRCode): Promise<void> {
    try {
      const copy = await this.codes.duplicate(qr.id);
      this.toast.success('Código duplicado');
      await this.router.navigate(['/codes', copy.id]);
    } catch {
      this.toast.error('No se pudo duplicar');
    }
  }

  protected askDelete(qr: QRCode): void {
    this.qrToDelete.set(qr);
    this.showDelete.set(true);
  }

  protected async doDelete(): Promise<void> {
    const qr = this.qrToDelete();
    if (!qr) return;
    try {
      await this.codes.remove(qr.id);
      this.toast.success('Código eliminado');
      this.showDelete.set(false);
      this.qrToDelete.set(null);
      await this.reload();
    } catch {
      this.toast.error('No se pudo eliminar');
    }
  }

  protected goCreate(): void {
    void this.router.navigate(['/codes/new']);
  }
}
