import { Injectable, effect, signal } from '@angular/core';

const THEME_KEY = 'sf_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal<boolean>(false);

  constructor() {
    const stored = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = stored ? stored === 'dark' : prefersDark;
    this.isDark.set(dark);

    effect(() => {
      this.applyTheme(this.isDark());
    });
  }

  toggle(): void {
    this.isDark.update((v) => !v);
  }

  private applyTheme(dark: boolean): void {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }
}
