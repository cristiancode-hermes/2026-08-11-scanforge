import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { ToastContainerComponent } from '../shared/toast-container.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastContainerComponent],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <div class="auth-logo" style="margin-bottom: 24px;">
          <div class="logo-mark">SF</div>
          <span class="logo-text nav-label">Scanforge</span>
        </div>
        <nav style="display: flex; flex-direction: column; gap: 2px; flex: 1;">
          <a routerLink="/codes" routerLinkActive="active" class="nav-item" [routerLinkActiveOptions]="{ exact: true }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM18 14h3v3h-3zM14 18h3v3h-3zM18 18h3v3h-3z"/></svg>
            <span class="nav-label">Códigos</span>
          </a>
          <a routerLink="/tags" routerLinkActive="active" class="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41 12 22l-9-9V4a1 1 0 0 1 1-1h9l8.59 8.41a2 2 0 0 1 0 2.83z"/><circle cx="7.5" cy="7.5" r="1.5" fill="currentColor"/></svg>
            <span class="nav-label">Etiquetas</span>
          </a>
          <a routerLink="/settings" routerLinkActive="active" class="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <span class="nav-label">Ajustes</span>
          </a>
        </nav>
      </aside>
      <div class="main">
        <header class="topbar">
          <div style="font-size: 13px; color: var(--color-graphite);">
            Generador de códigos QR con analítica
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button class="btn btn-ghost btn-icon" (click)="theme.toggle()" [attr.aria-label]="theme.isDark() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'">
              @if (theme.isDark()) {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              } @else {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              }
            </button>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--color-accent-soft); color: var(--color-accent-strong); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600;">
                {{ (auth.user()?.name ?? 'U').charAt(0).toUpperCase() }}
              </div>
              <button class="btn btn-ghost btn-sm" (click)="auth.logout()">Salir</button>
            </div>
          </div>
        </header>
        <main class="content">
          <router-outlet />
        </main>
      </div>
    </div>
    <app-toast-container />
  `,
})
export class AppShellComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);

  ngOnInit(): void {
    if (this.auth.isAuthenticated() && !this.auth.user()) {
      void this.auth.loadProfile();
    }
  }
}
