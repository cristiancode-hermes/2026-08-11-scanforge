import { Component, inject } from '@angular/core';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="toast-container">
      @for (toast of toast.toasts(); track toast.id) {
        <div class="toast" [class.toast-success]="toast.type === 'success'" [class.toast-error]="toast.type === 'error'" [class.toast-info]="toast.type === 'info'" (click)="dismiss(toast.id)">
          @if (toast.type === 'success') {
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m22 4-10 10.01-3-3"/></svg>
          } @else if (toast.type === 'error') {
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>
          } @else {
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          }
          {{ toast.text }}
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  readonly toast = inject(ToastService);

  dismiss(id: number): void {
    this.toast.dismiss(id);
  }
}
