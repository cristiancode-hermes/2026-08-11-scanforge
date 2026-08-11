import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TagsService } from '../../services/tags.service';
import { ToastService } from '../../services/toast.service';
import { Tag } from '../../interfaces/models';
import { SkeletonComponent } from '../../shared/skeleton.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { ConfirmModalComponent } from '../../shared/confirm-modal.component';
import { ColorPickerComponent, COLOR_PRESETS } from '../../shared/color-picker.component';

@Component({
  selector: 'app-tags-page',
  standalone: true,
  imports: [FormsModule, SkeletonComponent, EmptyStateComponent, ConfirmModalComponent, ColorPickerComponent],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Etiquetas</h1>
        <p class="page-subtitle">Organiza tus códigos por campaña o canal</p>
      </div>
      <button class="btn btn-primary" (click)="startCreate()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        Nueva etiqueta
      </button>
    </div>

    @if (tags.loading()) {
      <app-skeleton [rows]="3" />
    } @else if (tags.tags().length === 0) {
      <app-empty-state icon="▣" title="Sin etiquetas" message="Crea etiquetas para agrupar tus códigos por campaña, canal o tipo de QR." actionLabel="Crear etiqueta" (action)="startCreate()" />
    } @else {
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
        @for (tag of tags.tags(); track tag.id) {
          <div class="card card-hover">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: {{ tag.color }}; flex-shrink: 0;"></span>
                <span style="font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ tag.name }}</span>
              </div>
              <div style="display: flex; gap: 4px;">
                <button class="btn btn-ghost btn-icon" [attr.aria-label]="'Editar ' + tag.name" (click)="startEdit(tag)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                </button>
                <button class="btn btn-ghost btn-icon" style="color: var(--color-danger);" [attr.aria-label]="'Eliminar ' + tag.name" (click)="askDelete(tag)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                </button>
              </div>
            </div>
            <div style="margin-top: 12px; font-size: 13px; color: var(--color-graphite);">
              <span class="mono">{{ tag.qrCount ?? 0 }}</span> códigos asociados
            </div>
          </div>
        }
      </div>
    }

    <!-- Modal create/edit -->
    @if (showForm()) {
      <div class="modal-overlay" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ editing() ? 'Editar etiqueta' : 'Nueva etiqueta' }}</h3>
          <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px;">
            <div>
              <label class="label" for="tag-name">Nombre</label>
              <input id="tag-name" class="input" [(ngModel)]="formName" placeholder="Instagram" maxlength="40" />
            </div>
            <div>
              <label class="label">Color</label>
              <app-color-picker [(value)]="formColor" />
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="closeForm()">Cancelar</button>
            <button class="btn btn-primary" [disabled]="!formName().trim()" (click)="saveForm()">
              {{ editing() ? 'Guardar' : 'Crear' }}
            </button>
          </div>
        </div>
      </div>
    }

    <app-confirm-modal
      [visible]="showDelete()"
      title="Eliminar etiqueta"
      [message]="deleteMessage()"
      confirmLabel="Eliminar"
      [danger]="true"
      (confirm)="doDelete()"
      (cancel)="showDelete.set(false)"
    />
  `,
})
export class TagsPageComponent implements OnInit {
  readonly tags = inject(TagsService);
  private readonly toast = inject(ToastService);

  protected readonly showForm = signal(false);
  protected readonly editing = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly formName = signal('');
  protected readonly formColor = signal(COLOR_PRESETS[1]);
  protected readonly showDelete = signal(false);
  protected readonly tagToDelete = signal<Tag | null>(null);

  protected readonly deleteMessage = computed(() => {
    const tag = this.tagToDelete();
    if (!tag) return '';
    const count = tag.qrCount ?? 0;
    return count > 0
      ? `"${tag.name}" está asignada a ${count} código(s). Se desasignará de todos ellos.`
      : `¿Eliminar la etiqueta "${tag.name}"?`;
  });

  ngOnInit(): void {
    void this.tags.load();
  }

  protected startCreate(): void {
    this.editing.set(false);
    this.editingId.set(null);
    this.formName.set('');
    this.formColor.set(COLOR_PRESETS[1]);
    this.showForm.set(true);
  }

  protected startEdit(tag: Tag): void {
    this.editing.set(true);
    this.editingId.set(tag.id);
    this.formName.set(tag.name);
    this.formColor.set(tag.color);
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
  }

  protected async saveForm(): Promise<void> {
    const name = this.formName().trim();
    if (!name) return;
    try {
      if (this.editing() && this.editingId()) {
        await this.tags.update(this.editingId()!, { name, color: this.formColor() });
        this.toast.success('Etiqueta actualizada');
      } else {
        await this.tags.create(name, this.formColor());
        this.toast.success('Etiqueta creada');
      }
      this.showForm.set(false);
      await this.tags.load();
    } catch (err: any) {
      const msg = err?.error?.message ?? '';
      this.toast.error(msg.includes('already exists') ? `La etiqueta '${name}' ya existe` : 'No se pudo guardar');
    }
  }

  protected askDelete(tag: Tag): void {
    this.tagToDelete.set(tag);
    this.showDelete.set(true);
  }

  protected async doDelete(): Promise<void> {
    const tag = this.tagToDelete();
    if (!tag) return;
    try {
      await this.tags.remove(tag.id);
      this.toast.success('Etiqueta eliminada');
      this.showDelete.set(false);
      await this.tags.load();
    } catch {
      this.toast.error('No se pudo eliminar');
    }
  }
}
