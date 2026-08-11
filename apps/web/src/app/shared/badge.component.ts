import { Component, input } from '@angular/core';

@Component({
  selector: 'app-badge',
  standalone: true,
  template: `
    <span class="badge">
      <span class="badge-dot" [style.background]="color()"></span>
      {{ name() }}
    </span>
  `,
})
export class BadgeComponent {
  readonly name = input('');
  readonly color = input('#0E7490');
}
