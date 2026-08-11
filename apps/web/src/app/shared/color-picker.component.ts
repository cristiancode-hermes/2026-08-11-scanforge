import { Component, input, model } from '@angular/core';

export const COLOR_PRESETS = [
  '#16181D', '#0E7490', '#155E75', '#16A34A', '#D97706',
  '#DC2626', '#7C3AED', '#E1306C', '#0EA5E9', '#374151',
];

/** Selector de color hex con presets contrastados. */
@Component({
  selector: 'app-color-picker',
  standalone: true,
  template: `
    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
      @for (preset of presets(); track preset) {
        <button
          type="button"
          class="color-swatch"
          [style.background]="preset"
          [style.borderColor]="value() === preset ? 'var(--color-accent)' : 'var(--color-border)'"
          [style.boxShadow]="value() === preset ? 'var(--focus-ring)' : 'none'"
          [attr.aria-label]="'Color ' + preset"
          (click)="value.set(preset)"
        ></button>
      }
      <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--color-graphite); cursor: pointer;">
        <input
          type="color"
          [value]="value()"
          (input)="value.set($any($event.target).value)"
          style="width: 32px; height: 32px; border: 1px solid var(--color-border); border-radius: 6px; background: transparent; cursor: pointer; padding: 0;"
        />
        Custom
      </label>
    </div>
  `,
  styles: [`
    .color-swatch {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      border: 1px solid var(--color-border);
      cursor: pointer;
      transition: transform 100ms ease-out;
      padding: 0;
    }
    .color-swatch:hover { transform: scale(1.1); }
  `],
})
export class ColorPickerComponent {
  readonly value = model.required<string>();
  readonly presets = input<string[]>(COLOR_PRESETS);
}
