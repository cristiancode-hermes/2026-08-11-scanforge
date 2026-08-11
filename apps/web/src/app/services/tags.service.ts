import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { Tag } from '../interfaces/models';

@Injectable({ providedIn: 'root' })
export class TagsService {
  private readonly http = inject(HttpClient);

  readonly tags = signal<Tag[]>([]);
  readonly loading = signal(false);

  async load(): Promise<Tag[]> {
    this.loading.set(true);
    try {
      const tags = await lastValueFrom(this.http.get<Tag[]>('/api/tags'));
      this.tags.set(tags);
      return tags;
    } finally {
      this.loading.set(false);
    }
  }

  create(name: string, color: string): Promise<Tag> {
    return lastValueFrom(this.http.post<Tag>('/api/tags', { name, color }));
  }

  update(id: string, patch: { name?: string; color?: string }): Promise<Tag> {
    return lastValueFrom(this.http.patch<Tag>(`/api/tags/${id}`, patch));
  }

  remove(id: string): Promise<void> {
    return lastValueFrom(this.http.delete<void>(`/api/tags/${id}`));
  }
}
