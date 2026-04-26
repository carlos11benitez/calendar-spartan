import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideIcons } from '@ng-icons/core';
import { provideBrnCalendarI18n } from '@spartan-ng/brain/calendar';

import { routes } from './app.routes';
import { ICONS } from './core/icons/icons';
import { ThemeService } from './core/services/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withHashLocation()),
    provideAnimationsAsync(),
    provideIcons(ICONS),
    provideBrnCalendarI18n(),
    provideAppInitializer(() => inject(ThemeService).init()),
  ],
};
