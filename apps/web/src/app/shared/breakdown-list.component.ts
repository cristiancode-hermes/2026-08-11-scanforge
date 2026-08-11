import { Component, computed, input } from '@angular/core';

export interface BreakdownRow {
  label: string;
  count: number;
}

/** Lista de top referrers / dispositivos con barras proporcionales. */
@Component({
  selector: 'app-breakdown-list',
  standalone: true,
  template: `
    <div style="display: flex; flex-direction: column; gap: 4px;">
      @for (row of rows(); track row.label) {
        <div class="breakdown-row">
          <span class="breakdown-label" [title]="row.label">{{ row.label }}</span>
          <div class="breakdown-track">
            <div class="breakdown-fill" [style.width.%]="(row.count / maxCount()) * 100"></div>
          </div>
          <span class="breakdown-count">{{ row.count }}</span>
        </div>
      }
      @if (rows().length === 0) {
        <p style="color: var(--color-muted); font-size: 13px; margin: 8px 0;">Sin datos</p>
      }
    </div>
  `,
})
export class BreakdownListComponent {
  readonly data = input<BreakdownRow[]>([]);

  readonly rows = computed(() =>
    [...this.data()].sort((a, b) => b.count - a.count).slice(0, 8),
  );
  readonly maxCount = computed(() => Math.max(...this.rows().map((r) => r.count), 1));
}
