import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { QrStats, ScanEventItem } from '../interfaces/models';

@Injectable({ providedIn: 'root' })
export class ScansService {
  private readonly http = inject(HttpClient);

  readonly stats = signal<QrStats | null>(null);
  readonly range = signal<7 | 30 | 90>(30);
  readonly loadingStats = signal(false);
  readonly scans = signal<ScanEventItem[]>([]);
  readonly scansTotal = signal(0);
  readonly loadingScans = signal(false);

  async loadStats(qrCodeId: string): Promise<QrStats> {
    this.loadingStats.set(true);
    try {
      const params = new HttpParams().set('range', String(this.range()));
      const stats = await lastValueFrom(
        this.http.get<QrStats>(`/api/qr-codes/${qrCodeId}/stats`, { params }),
      );
      this.stats.set(stats);
      return stats;
    } finally {
      this.loadingStats.set(false);
    }
  }

  async loadScans(qrCodeId: string, page = 1, limit = 20): Promise<void> {
    this.loadingScans.set(true);
    try {
      const params = new HttpParams().set('page', String(page)).set('limit', String(limit));
      const res = await lastValueFrom(
        this.http.get<{ items: ScanEventItem[]; total: number }>(
          `/api/qr-codes/${qrCodeId}/scans`,
          { params },
        ),
      );
      this.scans.set(res.items);
      this.scansTotal.set(res.total);
    } finally {
      this.loadingScans.set(false);
    }
  }

  clearForQr(qrCodeId: string): Promise<void> {
    return lastValueFrom(this.http.delete<void>(`/api/qr-codes/${qrCodeId}/scans`));
  }

  removeScan(scanId: string): Promise<void> {
    return lastValueFrom(this.http.delete<void>(`/api/scans/${scanId}`));
  }

  exportCsvUrl(qrCodeId: string): string {
    return `/api/qr-codes/${qrCodeId}/scans/export`;
  }
}
