import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { QRCode, QrListResponse, QrStyle } from '../interfaces/models';

export interface QrQuery {
  search?: string;
  tagId?: string;
  sort?: 'createdAt' | 'scanCount';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateQrPayload {
  title: string;
  targetUrl: string;
  slug?: string;
  foregroundColor?: string;
  backgroundColor?: string;
  style?: QrStyle;
  tagIds?: string[];
}

@Injectable({ providedIn: 'root' })
export class QrCodesService {
  private readonly http = inject(HttpClient);

  readonly codes = signal<QRCode[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async load(query: QrQuery = {}): Promise<QrListResponse> {
    this.loading.set(true);
    this.error.set(null);
    try {
      let params = new HttpParams();
      if (query.search) params = params.set('search', query.search);
      if (query.tagId) params = params.set('tagId', query.tagId);
      params = params.set('sort', query.sort ?? 'createdAt');
      params = params.set('order', query.order ?? 'desc');
      params = params.set('page', String(query.page ?? 1));
      params = params.set('limit', String(query.limit ?? 12));
      const res = await lastValueFrom(
        this.http.get<QrListResponse>('/api/qr-codes', { params }),
      );
      this.codes.set(res.items);
      this.total.set(res.total);
      return res;
    } catch {
      this.error.set('No se pudieron cargar los códigos');
      throw new Error('load failed');
    } finally {
      this.loading.set(false);
    }
  }

  get(id: string): Promise<QRCode> {
    return lastValueFrom(this.http.get<QRCode>(`/api/qr-codes/${id}`));
  }

  create(payload: CreateQrPayload): Promise<QRCode> {
    return lastValueFrom(this.http.post<QRCode>('/api/qr-codes', payload));
  }

  update(id: string, payload: Partial<CreateQrPayload> & { isActive?: boolean }): Promise<QRCode> {
    return lastValueFrom(this.http.patch<QRCode>(`/api/qr-codes/${id}`, payload));
  }

  remove(id: string): Promise<void> {
    return lastValueFrom(this.http.delete<void>(`/api/qr-codes/${id}`));
  }

  duplicate(id: string): Promise<QRCode> {
    return lastValueFrom(this.http.post<QRCode>(`/api/qr-codes/${id}/duplicate`, {}));
  }

  async toggleActive(qr: QRCode): Promise<void> {
    // Update optimista con revert
    const prev = this.codes();
    this.codes.update((list) =>
      list.map((c) => (c.id === qr.id ? { ...c, isActive: !c.isActive } : c)),
    );
    try {
      const res = await lastValueFrom(
        this.http.post<{ isActive: boolean }>(`/api/qr-codes/${qr.id}/toggle-active`, {}),
      );
      this.codes.update((list) =>
        list.map((c) => (c.id === qr.id ? { ...c, isActive: res.isActive } : c)),
      );
    } catch {
      this.codes.set(prev);
    }
  }

  setTags(id: string, tagIds: string[]): Promise<QRCode> {
    return lastValueFrom(this.http.post<QRCode>(`/api/qr-codes/${id}/tags`, { tagIds }));
  }
}
