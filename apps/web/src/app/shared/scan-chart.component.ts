import { Component, computed, input } from '@angular/core';
import { DayBucket } from '../interfaces/models';

/**
 * Gráfica de barras SVG propia (sin librería externa).
 * Barras con altura proporcional + tooltip con valor exacto
 * (la gráfica no depende solo del color — a11y).
 */
@Component({
  selector: 'app-scan-chart',
  standalone: true,
  template: `
    @if (series().length > 0) {
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--color-muted); font-family: var(--font-mono);">
          <span>{{ firstLabel() }}</span>
          <span>{{ lastLabel() }}</span>
        </div>
        <svg [attr.viewBox]="'0 0 100 40'" style="width: 100%; height: 160px;" preserveAspectRatio="none" role="img" [attr.aria-label]="'Gráfica de escaneos por día'">
          @for (day of series(); track day.date; let i = $index) {
            <rect
              [attr.x]="(i / series().length) * 100"
              y="0"
              [attr.width]="(100 / series().length) * 0.7"
              [attr.height]="(day.scans / maxValue()) * 40"
              [attr.fill]="day.scans > 0 ? 'var(--color-accent)' : 'var(--color-surface-hover)'"
              rx="1"
            >
              <title>{{ day.date }}: {{ day.scans }} escaneos</title>
            </rect>
          }
        </svg>
      </div>
    }
  `,
})
export class ScanChartComponent {
  readonly series = input<DayBucket[]>([]);

  readonly maxValue = computed(() => Math.max(...this.series().map((d) => d.scans), 1));
  readonly firstLabel = computed(() => this.series()[0]?.date ?? '');
  readonly lastLabel = computed(() => this.series()[this.series().length - 1]?.date ?? '');
}
