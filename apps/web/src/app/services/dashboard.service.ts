import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { DashboardStats } from '../interfaces/models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  readonly stats = signal<DashboardStats | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const stats = await lastValueFrom(this.http.get<DashboardStats>('/api/dashboard/stats'));
      this.stats.set(stats);
    } catch {
      this.error.set('No se pudieron cargar las estadísticas');
    } finally {
      this.loading.set(false);
    }
  }
}
