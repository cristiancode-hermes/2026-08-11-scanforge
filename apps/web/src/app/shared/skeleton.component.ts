import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div class="card" style="padding: 0; overflow: hidden;">
      @for (row of [].constructor(rows()); track $index) {
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--color-border);">
          <div class="skeleton" style="width: 36px; height: 36px; border-radius: 8px;"></div>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
            <div class="skeleton" style="height: 10px; width: 60%;"></div>
            <div class="skeleton" style="height: 10px; width: 35%;"></div>
          </div>
          <div class="skeleton" style="height: 10px; width: 48px;"></div>
        </div>
      }
    </div>
  `,
})
export class SkeletonComponent {
  readonly rows = input(3);
}
