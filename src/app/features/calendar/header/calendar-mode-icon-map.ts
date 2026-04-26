// calendar-spartan/src/app/features/calendar/header/calendar-mode-icon-map.ts
import type { Mode } from '../calendar-types';

/**
 * Icon-name lookup for the Day / Week / Month mode switcher buttons.
 *
 * Values MUST match keys registered via `provideIcons(ICONS)` in `app.config.ts`:
 *   day   -> List       (lucideList)
 *   week  -> Columns2   (lucideColumns2)
 *   month -> Grid3X3    (lucideGrid3x3; ng-icons exports lowercase x)
 *
 * Do not reorder or change values — the mode switcher tests assert this mapping.
 */
export const calendarModeIconMap = {
  day:   'lucideList',
  week:  'lucideColumns2',
  month: 'lucideGrid3x3',
} as const satisfies Record<Mode, string>;
