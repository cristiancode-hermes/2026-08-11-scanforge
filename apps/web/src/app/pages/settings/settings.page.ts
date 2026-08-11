import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmModalComponent } from '../../shared/confirm-modal.component';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [FormsModule, ConfirmModalComponent],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Ajustes</h1>
        <p class="page-subtitle">Perfil y seguridad de tu cuenta</p>
      </div>
    </div>

    <div style="display: flex; flex-direction: column; gap: 24px; max-width: 560px;">
      <div class="card">
        <h3 class="section-title">Perfil</h3>
        <form (ngSubmit)="saveProfile()" style="display: flex; flex-direction: column; gap: 16px;">
          <div>
            <label class="label" for="profile-name">Nombre</label>
            <input id="profile-name" class="input" [(ngModel)]="name" name="profile-name" />
          </div>
          <div>
            <label class="label" for="profile-email">Email</label>
            <input id="profile-email" class="input" type="email" [(ngModel)]="email" name="profile-email" />
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 12px; color: var(--color-muted);">Se guarda automáticamente al salir del campo</span>
            <button class="btn btn-primary btn-sm" type="submit" [disabled]="savingProfile()">Guardar</button>
          </div>
        </form>
      </div>

      <div class="card">
        <h3 class="section-title">Cambiar contraseña</h3>
        <form (ngSubmit)="changePassword()" style="display: flex; flex-direction: column; gap: 16px;">
          <div>
            <label class="label" for="current-password">Contraseña actual</label>
            <input id="current-password" class="input" type="password" [(ngModel)]="currentPassword" name="current-password" />
          </div>
          <div>
            <label class="label" for="new-password">Nueva contraseña</label>
            <input id="new-password" class="input" type="password" [(ngModel)]="newPassword" name="new-password" placeholder="Mínimo 8 caracteres" />
            @if (newPassword && newPassword.length < 8) {
              <p class="field-error">Mínimo 8 caracteres</p>
            }
          </div>
          @if (passwordError()) {
            <div style="background: rgba(220,38,38,0.08); color: var(--color-danger); border-radius: 6px; padding: 10px 12px; font-size: 13px;">
              {{ passwordError() }}
            </div>
          }
          <div style="display: flex; justify-content: flex-end;">
            <button class="btn btn-primary btn-sm" type="submit" [disabled]="savingPassword() || newPassword.length < 8">
              {{ savingPassword() ? 'Cambiando…' : 'Cambiar contraseña' }}
            </button>
          </div>
        </form>
      </div>

      <div class="card" style="border-color: rgba(220,38,38,0.3);">
        <h3 class="section-title" style="color: var(--color-danger);">Zona de peligro</h3>
        <p style="font-size: 13px; color: var(--color-graphite); margin: 0 0 16px;">Borrar tu cuenta elimina todos tus códigos, escaneos y etiquetas. No se puede deshacer.</p>
        <button class="btn btn-danger btn-sm" (click)="askDelete()">Borrar mi cuenta</button>
      </div>
    </div>

    <app-confirm-modal
      [visible]="showDelete()"
      title="Borrar cuenta"
      message="Se eliminarán todos tus códigos QR, escaneos y etiquetas. Esta acción es irreversible."
      confirmLabel="Borrar todo"
      [danger]="true"
      (confirm)="doDelete()"
      (cancel)="showDelete.set(false)"
    />
  `,
})
export class SettingsPageComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected name = '';
  protected email = '';
  protected currentPassword = '';
  protected newPassword = '';
  protected readonly savingProfile = signal(false);
  protected readonly savingPassword = signal(false);
  protected readonly passwordError = signal('');
  protected readonly showDelete = signal(false);

  ngOnInit(): void {
    const user = this.auth.user();
    if (user) {
      this.name = user.name;
      this.email = user.email;
    } else {
      void this.auth.loadProfile().then(() => {
        const u = this.auth.user();
        if (u) {
          this.name = u.name;
          this.email = u.email;
        }
      });
    }
  }

  protected async saveProfile(): Promise<void> {
    this.savingProfile.set(true);
    try {
      await this.auth.updateProfile({ name: this.name, email: this.email });
      this.toast.success('Guardado ✓');
    } catch (err: any) {
      const msg = err?.error?.message ?? '';
      this.toast.error(msg.includes('already registered') ? 'Email already registered' : 'No se pudo guardar');
    } finally {
      this.savingProfile.set(false);
    }
  }

  protected async changePassword(): Promise<void> {
    if (this.newPassword.length < 8) return;
    this.savingPassword.set(true);
    this.passwordError.set('');
    try {
      await this.auth.changePassword(this.currentPassword, this.newPassword);
      this.toast.success('Contraseña actualizada');
      this.currentPassword = '';
      this.newPassword = '';
    } catch (err: any) {
      const msg = err?.error?.message ?? '';
      this.passwordError.set(msg.includes('Current password') ? 'La contraseña actual no es correcta' : 'No se pudo cambiar');
    } finally {
      this.savingPassword.set(false);
    }
  }

  protected askDelete(): void {
    this.showDelete.set(true);
  }

  protected async doDelete(): Promise<void> {
    try {
      await this.auth.deleteAccount();
      this.toast.info('Cuenta eliminada');
    } catch {
      this.toast.error('No se pudo borrar la cuenta');
    }
  }
}
