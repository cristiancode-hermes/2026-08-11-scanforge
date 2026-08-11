import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { AuthResponse, User } from '../interfaces/models';

const TOKEN_KEY = 'sf_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  readonly user = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.token() !== null);

  async login(identifier: string, password: string): Promise<void> {
    const res = await lastValueFrom(
      this.http.post<AuthResponse>('/api/auth/login', { identifier, password }),
    );
    this.setSession(res);
  }

  async register(email: string, password: string, name: string): Promise<void> {
    const res = await lastValueFrom(
      this.http.post<AuthResponse>('/api/auth/register', { email, password, name }),
    );
    this.setSession(res);
  }

  async loadProfile(): Promise<void> {
    if (!this.token()) return;
    try {
      const user = await lastValueFrom(this.http.get<User>('/api/auth/me'));
      this.user.set(user);
    } catch {
      this.logout();
    }
  }

  async updateProfile(profile: { email?: string; name?: string }): Promise<User> {
    const user = await lastValueFrom(
      this.http.patch<User>('/api/auth/profile', profile),
    );
    this.user.set(user);
    return user;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const res = await lastValueFrom(
      this.http.post<{ token: string }>('/api/auth/change-password', {
        currentPassword,
        newPassword,
      }),
    );
    localStorage.setItem(TOKEN_KEY, res.token);
    this.token.set(res.token);
  }

  async deleteAccount(): Promise<void> {
    await lastValueFrom(this.http.post('/api/auth/delete-account', {}));
    this.logout();
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.token.set(null);
    this.user.set(null);
    void this.router.navigate(['/login']);
  }

  private setSession(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    this.token.set(res.token);
    this.user.set(res.user);
  }
}
