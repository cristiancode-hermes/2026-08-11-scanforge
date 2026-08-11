import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { QrCodesService } from '../../services/qr-codes.service';
import { ScansService } from '../../services/scans.service';
import { ToastService } from '../../services/toast.service';
import { DownloadService } from '../../services/download.service';
import { QRCode, ScanEventItem } from '../../interfaces/models';
import { QrPreviewComponent } from '../../shared/qr-preview.component';
import { ScanChartComponent } from '../../shared/scan-chart.component';
import { BreakdownListComponent } from '../../shared/breakdown-list.component';
import { SkeletonComponent } from '../../shared/skeleton.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { ConfirmModalComponent } from '../../shared/confirm-modal.component';
import { BadgeComponent } from '../../shared/badge.component';

@Component({
  selector: 'app-qr-detail-page',
  standalone: true,
  imports: [DatePipe, RouterLink, QrPreviewComponent, ScanChartComponent, BreakdownListComponent, SkeletonComponent, EmptyStateComponent, ConfirmModalComponent, BadgeComponent],
  template: `
    @if (!qr()) {
      <app-skeleton [rows]="5" />
    } @else {
      <div class="page-header">
        <div>
          <a routerLink="/codes" style="font-size: 13px; color: var(--color-graphite);">← Códigos</a>
          <h1 class="page-title" style="margin-top: 4px;">{{ qr()!.title }}</h1>
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px; flex-wrap: wrap;">
            <span class="status-pill" [class.active]="qr()!.isActive" [class.inactive]="!qr()!.isActive">
              <span class="dot"></span>{{ qr()!.isActive ? 'Activo' : 'Inactivo' }}
            </span>
            <span class="mono-sm" style="color: var(--color-graphite);">/api/r/{{ qr()!.slug }}</span>
            <span class="mono-sm" style="color: var(--color-muted);">creado {{ qr()!.createdAt | date:'dd MMM yyyy' }}</span>
          </div>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <a class="btn btn-secondary btn-sm" [routerLink]="['/codes', qr()!.id, 'edit']">Editar</a>
          <button class="btn btn-secondary btn-sm" (click)="duplicate()">Duplicar</button>
          <button class="btn btn-ghost btn-sm" (click)="toggleActive()">{{ qr()!.isActive ? 'Desactivar' : 'Activar' }}</button>
          <button class="btn btn-ghost btn-sm" style="color: var(--color-danger);" (click)="askDelete()">Eliminar</button>
        </div>
      </div>

      <!-- QR + URL + descargas -->
      <div style="display: grid; grid-template-columns: 220px 1fr; gap: 24px; margin-bottom: 24px;">
        <div class="card" style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
          <app-qr-preview [value]="'/api/r/' + qr()!.slug" [foregroundColor]="qr()!.foregroundColor" [backgroundColor]="qr()!.backgroundColor" [size]="180" />
          <div style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: center;">
            <button class="btn btn-secondary btn-sm" (click)="downloadPng(300)">PNG 300</button>
            <button class="btn btn-secondary btn-sm" (click)="downloadPng(512)">PNG 512</button>
            <button class="btn btn-secondary btn-sm" (click)="downloadPng(1024)">PNG 1024</button>
            <button class="btn btn-secondary btn-sm" (click)="downloadSvg()">SVG</button>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div class="card">
            <h3 class="section-title" style="margin-bottom: 8px;">Etiquetas</h3>
            @if (qr()!.tags.length > 0) {
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                @for (tag of qr()!.tags; track tag.id) {
                  <app-badge [name]="tag.name" [color]="tag.color" />
                }
              </div>
            } @else {
              <p style="color: var(--color-muted); font-size: 13px; margin: 0;">Sin etiquetas</p>
            }
          </div>
          <div class="card">
            <h3 class="section-title" style="margin-bottom: 8px;">Destino</h3>
            <p class="mono" style="margin: 0; word-break: break-all;">{{ qr()!.targetUrl }}</p>
            <p class="field-hint" style="margin-top: 8px;">Escanea el QR o visita <span class="mono-sm">/api/r/{{ qr()!.slug }}</span> — se registrará cada escaneo.</p>
          </div>
        </div>
      </div>

      <!-- KPI row -->
      <div class="kpi-grid" style="margin-bottom: 24px;">
        <div class="card">
          <div class="kpi-label">Total escaneos</div>
          <div class="kpi-value">{{ stats()?.total ?? 0 }}</div>
        </div>
        <div class="card">
          <div class="kpi-label">Últimos 7 días</div>
          <div class="kpi-value">{{ last7d() }}</div>
        </div>
        <div class="card">
          <div class="kpi-label">Últimos 30 días</div>
          <div class="kpi-value">{{ last30d() }}</div>
        </div>
        <div class="card">
          <div class="kpi-label">Media / día (7d)</div>
          <div class="kpi-value">{{ avg7d() }}</div>
        </div>
      </div>

      <!-- Gráfica -->
      <div class="card" style="margin-bottom: 24px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <h3 class="section-title" style="margin: 0;">Escaneos por día</h3>
          <div style="display: flex; gap: 4px;">
            @for (r of ranges; track r) {
              <button class="btn btn-sm" [class.btn-primary]="range() === r" [class.btn-ghost]="range() !== r" (click)="setRange(r)">{{ r }}d</button>
            }
          </div>
        </div>
        @if (scans.loadingStats()) {
          <div class="skeleton" style="height: 160px;"></div>
        } @else if (stats() && stats()!.total > 0) {
          <app-scan-chart [series]="stats()!.perDay" />
        } @else {
          <app-empty-state icon="▦" title="Aún no hay escaneos" message="Imprime el QR y escanéalo con cualquier cámara para ver los datos aquí." />
        }
      </div>

      <!-- Referrers + dispositivos -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
        <div class="card">
          <h3 class="section-title">Top referrers · 30 días</h3>
          <app-breakdown-list [data]="referrerRows()" />
        </div>
        <div class="card">
          <h3 class="section-title">Dispositivos · 30 días</h3>
          <app-breakdown-list [data]="deviceRows()" />
        </div>
      </div>

      <!-- Escaneos recientes -->
      <div class="card" style="padding: 0;">
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 16px 12px;">
          <h3 class="section-title" style="margin: 0;">Escaneos recientes</h3>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" (click)="exportCsv()">Exportar CSV</button>
            <button class="btn btn-ghost btn-sm" style="color: var(--color-danger);" (click)="askClearScans()">Limpiar</button>
          </div>
        </div>
        @if (scans.loadingScans()) {
          <app-skeleton [rows]="3" />
        } @else if (scans.scans().length === 0) {
          <app-empty-state icon="▦" title="Sin escaneos" message="Los escaneos aparecerán aquí con dispositivo, referrer y hora exacta." />
        } @else {
          <div class="table-container" style="border: none; border-radius: 0;">
            <table>
              <thead>
                <tr><th>Fecha</th><th>Dispositivo</th><th>Locale</th><th>Referrer</th></tr>
              </thead>
              <tbody>
                @for (scan of scans.scans(); track scan.id) {
                  <tr style="cursor: pointer;" (click)="openScanDetail(scan)">
                    <td><span class="mono-sm">{{ scan.scannedAt | date:'dd MMM yyyy HH:mm' }}</span></td>
                    <td>{{ scan.deviceType ?? '—' }}</td>
                    <td class="mono-sm">{{ scan.locale ?? '—' }}</td>
                    <td style="max-width: 240px;">
                      <span style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" [title]="scan.referrer ?? ''">{{ scan.referrer ?? '(directo)' }}</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    }

    <!-- Modal detalle de escaneo -->
    @if (scanDetail()) {
      <div class="modal-overlay" (click)="scanDetail.set(null)">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Detalle del escaneo</h3>
          <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
            <div>
              <div class="label" style="margin-bottom: 2px;">Fecha</div>
              <div class="mono">{{ scanDetail()!.scannedAt | date:'dd MMM yyyy HH:mm:ss' }}</div>
            </div>
            <div>
              <div class="label" style="margin-bottom: 2px;">Dispositivo</div>
              <div>{{ scanDetail()!.deviceType ?? '—' }}</div>
            </div>
            <div>
              <div class="label" style="margin-bottom: 2px;">Referrer</div>
              <div class="mono" style="word-break: break-all;">{{ scanDetail()!.referrer ?? '(directo)' }}</div>
            </div>
            <div>
              <div class="label" style="margin-bottom: 2px;">Locale</div>
              <div class="mono">{{ scanDetail()!.locale ?? '—' }}</div>
            </div>
            <div>
              <div class="label" style="margin-bottom: 2px;">User-Agent</div>
              <div style="font-size: 12px; color: var(--color-graphite); word-break: break-all;">{{ scanDetail()!.userAgent ?? '—' }}</div>
            </div>
            <div>
              <div class="label" style="margin-bottom: 2px;">IP hash</div>
              <div class="mono" style="font-size: 12px;">{{ scanDetail()!.ipHash ?? '—' }}</div>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="scanDetail.set(null)">Cerrar</button>
          </div>
        </div>
      </div>
    }

    <app-confirm-modal
      [visible]="showDelete()"
      title="Eliminar código"
      [message]="'¿Seguro? Se borrarán el código y sus ' + (stats()?.total ?? 0) + ' escaneos.'"
      confirmLabel="Eliminar"
      [danger]="true"
      (confirm)="doDelete()"
      (cancel)="showDelete.set(false)"
    />
    <app-confirm-modal
      [visible]="showClearScans()"
      title="Limpiar escaneos"
      message="Se borrará todo el historial de escaneos de este código. Esta acción no se puede deshacer."
      confirmLabel="Limpiar"
      [danger]="true"
      (confirm)="doClearScans()"
      (cancel)="showClearScans.set(false)"
    />
  `,
})
export class QrDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly qrCodes = inject(QrCodesService);
  readonly scans = inject(ScansService);
  private readonly toast = inject(ToastService);
  private readonly download = inject(DownloadService);

  protected readonly qr = signal<QRCode | null>(null);
  protected readonly range = signal<7 | 30 | 90>(30);
  protected readonly showDelete = signal(false);
  protected readonly showClearScans = signal(false);
  protected readonly scanDetail = signal<ScanEventItem | null>(null);

  protected readonly ranges: (7 | 30 | 90)[] = [7, 30, 90];

  protected readonly stats = this.scans.stats;

  protected readonly last7d = computed(() => this.sumRange(7));
  protected readonly last30d = computed(() => this.sumRange(30));
  protected readonly avg7d = computed(() => {
    const s = this.stats();
    if (!s) return '0';
    return (s.total / 7).toFixed(1);
  });

  protected readonly referrerRows = computed(() =>
    (this.stats()?.topReferrers ?? []).map((r) => ({ label: r.referrer, count: r.scans })),
  );
  protected readonly deviceRows = computed(() =>
    (this.stats()?.byDevice ?? []).map((d) => ({ label: d.device, count: d.scans })),
  );

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
    } catch {
      this.toast.error('Código no encontrado');
      void this.router.navigate(['/codes']);
      return;
    }
    void this.scans.loadStats(id);
    void this.scans.loadScans(id, 1, 20);
  }

  protected setRange(r: 7 | 30 | 90): void {
    this.range.set(r);
    const id = this.qr()?.id;
    if (id) void this.scans.loadStats(id);
  }

  private sumRange(days: number): number {
    const s = this.stats();
    if (!s) return 0;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return s.perDay
      .filter((d) => new Date(d.date + 'T00:00:00') >= cutoff)
      .reduce((acc, d) => acc + d.scans, 0);
  }

  protected async downloadPng(size: number): Promise<void> {
    const qr = this.qr();
    if (!qr) return;
    try {
      const blob = await fetch(`/api/qr-codes/${qr.id}/download/png?size=${size}`, { headers: this.authHeaders() }).then((r) => r.blob());
      this.download.downloadBlob(blob, `${qr.slug}.png`);
      this.toast.success('PNG descargado');
    } catch {
      this.toast.error('No se pudo descargar');
    }
  }

  protected async downloadSvg(): Promise<void> {
    const qr = this.qr();
    if (!qr) return;
    try {
      const blob = await fetch(`/api/qr-codes/${qr.id}/download/svg`, { headers: this.authHeaders() }).then((r) => r.blob());
      this.download.downloadBlob(blob, `${qr.slug}.svg`);
      this.toast.success('SVG descargado');
    } catch {
      this.toast.error('No se pudo descargar');
    }
  }

  protected exportCsv(): void {
    const qr = this.qr();
    if (!qr) return;
    window.open(`/api/qr-codes/${qr.id}/scans/export`, '_blank');
  }

  protected async toggleActive(): Promise<void> {
    const qr = this.qr();
    if (!qr) return;
    await this.qrCodes.toggleActive(qr);
    this.qr.update((q) => (q ? { ...q, isActive: !q.isActive } : q));
  }

  protected async duplicate(): Promise<void> {
    const qr = this.qr();
    if (!qr) return;
    try {
      const copy = await this.qrCodes.duplicate(qr.id);
      this.toast.success('Código duplicado');
      await this.router.navigate(['/codes', copy.id]);
    } catch {
      this.toast.error('No se pudo duplicar');
    }
  }

  protected askDelete(): void {
    this.showDelete.set(true);
  }

  protected async doDelete(): Promise<void> {
    const qr = this.qr();
    if (!qr) return;
    try {
      await this.qrCodes.remove(qr.id);
      this.toast.success('Código eliminado');
      await this.router.navigate(['/codes']);
    } catch {
      this.toast.error('No se pudo eliminar');
    }
  }

  protected askClearScans(): void {
    this.showClearScans.set(true);
  }

  protected async doClearScans(): Promise<void> {
    const qr = this.qr();
    if (!qr) return;
    try {
      await this.scans.clearForQr(qr.id);
      this.toast.success('Escaneos limpiados');
      this.showClearScans.set(false);
      await this.scans.loadStats(qr.id);
      await this.scans.loadScans(qr.id, 1, 20);
    } catch {
      this.toast.error('No se pudieron limpiar');
    }
  }

  protected openScanDetail(scan: ScanEventItem): void {
    this.scanDetail.set(scan);
  }

  private authHeaders(): Record<string, string> {
    const token = localStorage.getItem('sf_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}
