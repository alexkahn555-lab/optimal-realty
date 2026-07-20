import type { Locale, Localized } from '@/lib/types';
import { DEFAULT_LOCALE, LOCALES } from '@/config/origin';

/**
 * lib/i18n — the thin locale helper. No library (Part: dispatch forbids i18n deps).
 * Just enough to validate a route segment and resolve a `Localized` per locale.
 */

/** Type guard: is this arbitrary segment one of the supported locales? */
export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (LOCALES as readonly string[]).includes(value);
}

/** Resolve a Localized value for a locale. The one legal way to read locale text. */
export function t<T>(value: Localized<T>, locale: Locale): T {
  return value[locale];
}

/** The other locale — used by LocaleSwitch and hreflang alternates. */
export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'es' : 'en';
}

export { DEFAULT_LOCALE, LOCALES };
