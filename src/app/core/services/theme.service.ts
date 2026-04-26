import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'cal-spartan-theme';
const DARK_CLASS = 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);

  private readonly _theme = signal<Theme>('light');
  readonly theme = this._theme.asReadonly();
  readonly isDark = computed(() => this._theme() === 'dark');

  /** Called from provideAppInitializer — reads localStorage and applies class. */
  init(): void {
    this.set(this.readInitial());
  }

  toggle(): void {
    this.set(this._theme() === 'dark' ? 'light' : 'dark');
  }

  set(theme: Theme): void {
    this._theme.set(theme);
    this.apply(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* SSR / private mode — ignore */
    }
  }

  private apply(theme: Theme): void {
    const el = this.doc.documentElement;
    if (theme === 'dark') {
      el.classList.add(DARK_CLASS);
    } else {
      el.classList.remove(DARK_CLASS);
    }
  }

  private readInitial(): Theme {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      /* ignore */
    }
    return 'light';
  }
}
