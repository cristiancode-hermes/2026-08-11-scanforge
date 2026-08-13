import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <h2 style="font-size: 24px; font-weight: 600; letter-spacing: -0.02em; margin: 0 0 4px;">Iniciar sesión</h2>
    <p style="color: var(--color-graphite); margin: 0 0 24px;">Accede a tu panel de códigos QR</p>

    <form (ngSubmit)="submit()" style="display: flex; flex-direction: column; gap: 16px;">
      <div>
        <label class="label" for="identifier">Email o nombre</label>
        <input
          id="identifier"
          class="input"
          [(ngModel)]="identifier"
          name="identifier"
          placeholder="ana@example.com"
          autocomplete="off"
          required
        />
      </div>
      <div>
        <label class="label" for="password">Contraseña</label>
        <div style="position: relative;">
          <input
            id="password"
            class="input"
            [type]="showPassword ? 'text' : 'password'"
            [(ngModel)]="password"
            name="password"
            placeholder="••••••••"
            autocomplete="new-password"
            required
          />
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            style="position: absolute; right: 4px; top: 50%; transform: translateY(-50%);"
            (click)="showPassword = !showPassword"
            [attr.aria-label]="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
          >{{ showPassword ? 'Ocultar' : 'Mostrar' }}</button>
        </div>
      </div>

      @if (error()) {
        <div style="background: rgba(220,38,38,0.08); color: var(--color-danger); border-radius: 6px; padding: 10px 12px; font-size: 13px;">
          {{ error() }}
        </div>
      }

      <button class="btn btn-primary" type="submit" [disabled]="submitting() || !identifier || !password">
        {{ submitting() ? 'Entrando…' : 'Iniciar sesión' }}
      </button>
    </form>

    <p style="margin-top: 24px; text-align: center; font-size: 13px; color: var(--color-graphite);">
      ¿No tienes cuenta? <a routerLink="/register">Regístrate</a>
    </p>
    <p style="margin-top: 12px; text-align: center; font-size: 12px; color: var(--color-muted); font-family: var(--font-mono);">
      demo@scanforge.app / demo1234
    </p>
  `,
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected identifier = '';
  protected password = '';
  protected showPassword = false;
  protected readonly submitting = signal(false);
  protected readonly error = signal('');

  async submit(): Promise<void> {
    if (!this.identifier || !this.password || this.submitting()) return;
    this.submitting.set(true);
    this.error.set('');
    try {
      await this.auth.login(this.identifier, this.password);
      this.toast.success('Bienvenido de nuevo');
      await this.router.navigate(['/codes']);
    } catch (err: any) {
      this.error.set(err?.error?.message === 'Invalid credentials' ? 'Credenciales inválidas' : 'No se pudo iniciar sesión');
    } finally {
      this.submitting.set(false);
    }
  }
}
