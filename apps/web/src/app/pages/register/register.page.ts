import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <h2 style="font-size: 24px; font-weight: 600; letter-spacing: -0.02em; margin: 0 0 4px;">Crear cuenta</h2>
    <p style="color: var(--color-graphite); margin: 0 0 24px;">Empieza a medir tus códigos QR</p>

    <form (ngSubmit)="submit()" style="display: flex; flex-direction: column; gap: 16px;">
      <div>
        <label class="label" for="name">Nombre</label>
        <input
          id="name"
          class="input"
          [(ngModel)]="name"
          name="name"
          placeholder="Ana"
          required
        />
      </div>
      <div>
        <label class="label" for="email">Email</label>
        <input
          id="email"
          class="input"
          [(ngModel)]="email"
          name="email"
          type="email"
          placeholder="ana@example.com"
          autocomplete="email"
          required
        />
        @if (email && !emailValid) {
          <p class="field-error">Formato de email inválido</p>
        }
      </div>
      <div>
        <label class="label" for="password">Contraseña</label>
        <input
          id="password"
          class="input"
          type="password"
          [(ngModel)]="password"
          name="password"
          placeholder="Mínimo 8 caracteres"
          autocomplete="new-password"
          required
        />
        @if (password && password.length < 8) {
          <p class="field-error">Mínimo 8 caracteres</p>
        }
      </div>

      @if (error()) {
        <div style="background: rgba(220,38,38,0.08); color: var(--color-danger); border-radius: 6px; padding: 10px 12px; font-size: 13px;">
          {{ error() }}
        </div>
      }

      <button class="btn btn-primary" type="submit" [disabled]="submitting() || !formValid">
        {{ submitting() ? 'Creando…' : 'Registrarse' }}
      </button>
    </form>

    <p style="margin-top: 24px; text-align: center; font-size: 13px; color: var(--color-graphite);">
      ¿Ya tienes cuenta? <a routerLink="/login">Inicia sesión</a>
    </p>
  `,
})
export class RegisterPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected name = '';
  protected email = '';
  protected password = '';
  protected readonly submitting = signal(false);
  protected readonly error = signal('');

  protected get emailValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  protected get formValid(): boolean {
    return this.name.length >= 2 && this.emailValid && this.password.length >= 8;
  }

  async submit(): Promise<void> {
    if (!this.formValid || this.submitting()) return;
    this.submitting.set(true);
    this.error.set('');
    try {
      await this.auth.register(this.email, this.password, this.name);
      this.toast.success('Cuenta creada');
      await this.router.navigate(['/codes']);
    } catch (err: any) {
      const msg = err?.error?.message;
      this.error.set(msg === 'Email already registered' ? 'Email already registered' : 'No se pudo crear la cuenta');
    } finally {
      this.submitting.set(false);
    }
  }
}
