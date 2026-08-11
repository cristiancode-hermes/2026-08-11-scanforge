import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  template: `
    @if (visible()) {
      <div class="modal-overlay" (click)="cancel.emit()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ title() }}</h3>
          <p>{{ message() }}</p>
          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="cancel.emit()">Cancelar</button>
            <button class="btn" [class.btn-danger]="danger()" [class.btn-primary]="!danger()" (click)="confirm.emit()">
              {{ confirmLabel() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmModalComponent {
  readonly visible = input(false);
  readonly title = input('¿Confirmar?');
  readonly message = input('');
  readonly confirmLabel = input('Confirmar');
  readonly danger = input(false);
  readonly confirm = output<void>();
  readonly cancel = output<void>();
}
