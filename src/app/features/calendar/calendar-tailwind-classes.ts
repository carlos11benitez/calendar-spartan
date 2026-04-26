/**
 * calendar-tailwind-classes.ts
 *
 * Static Tailwind class lookup for calendar event colors.
 * All class strings are full literals — zero template interpolation — so
 * Tailwind's content scanner picks up every class at build time.
 *
 * `EventColor` and `ColorClassSet` are declared here (derived from the map)
 * and re-exported from `calendar-types.ts` without a circular import:
 * this file is the single source of truth, calendar-types simply re-exports.
 */

/**
 * Three semantic Tailwind class strings associated with each event color.
 *   surface → event card host: 10% bg tint + border + hover (no text, no solid bg)
 *   text    → event card inner content: text-{c}-700 dark:text-{c}-300
 *   swatch  → color picker button: solid bg-{c}-500 (no alpha) for dark-mode visibility
 */
export type ColorClassSet = {
  readonly surface: string;
  readonly text: string;
  readonly swatch: string;
};

/**
 * Static lookup from event color key to its Tailwind class strings.
 * `as const` + explicit type annotation locks every string at compile time.
 *
 * Three slots per color (7 colors × 3 slots = 21 distinct string literals):
 *   surface — bg tint + border + hover
 *   text    — text color only
 *   swatch  — solid bg for color picker buttons
 */
export const EVENT_COLOR_CLASSES = {
  blue: {
    surface: 'bg-blue-500/10 border-blue-500 hover:bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-300',
    swatch: 'bg-blue-500',
  },
  indigo: {
    surface: 'bg-indigo-500/10 border-indigo-500 hover:bg-indigo-500/20',
    text: 'text-indigo-700 dark:text-indigo-300',
    swatch: 'bg-indigo-500',
  },
  pink: {
    surface: 'bg-pink-500/10 border-pink-500 hover:bg-pink-500/20',
    text: 'text-pink-700 dark:text-pink-300',
    swatch: 'bg-pink-500',
  },
  red: {
    surface: 'bg-red-500/10 border-red-500 hover:bg-red-500/20',
    text: 'text-red-700 dark:text-red-300',
    swatch: 'bg-red-500',
  },
  orange: {
    surface: 'bg-orange-500/10 border-orange-500 hover:bg-orange-500/20',
    text: 'text-orange-700 dark:text-orange-300',
    swatch: 'bg-orange-500',
  },
  amber: {
    surface: 'bg-amber-500/10 border-amber-500 hover:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-300',
    swatch: 'bg-amber-500',
  },
  emerald: {
    surface: 'bg-emerald-500/10 border-emerald-500 hover:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    swatch: 'bg-emerald-500',
  },
} as const satisfies Record<string, ColorClassSet>;

/**
 * The 7 allowed event color keys. Derived from `EVENT_COLOR_CLASSES` so
 * adding/removing a color from the map automatically updates this type.
 */
export type EventColor = keyof typeof EVENT_COLOR_CLASSES;

/**
 * Ordered array of color picker options.
 * Shape: `ReadonlyArray<{ value: EventColor; label: string }>` — used by
 * the event-dialog color picker.
 */
export const COLOR_OPTIONS: ReadonlyArray<{ value: EventColor; label: string }> = [
  { value: 'blue', label: 'Blue' },
  { value: 'indigo', label: 'Indigo' },
  { value: 'pink', label: 'Pink' },
  { value: 'red', label: 'Red' },
  { value: 'orange', label: 'Orange' },
  { value: 'amber', label: 'Amber' },
  { value: 'emerald', label: 'Emerald' },
] as const;
