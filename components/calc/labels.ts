import { UI } from '@/content/ui-strings';
import { t } from '@/lib/i18n';
import type { Locale, Localized } from '@/lib/types';

/**
 * FieldSpec.labelKey / helperKey → Localized chrome string. Keys are
 * '<group>.<name>' into content/ui-strings.ts. A missing key is a build-time
 * authoring bug, so it throws rather than rendering a raw key to a visitor.
 */
export function uiString(key: string): Localized {
  const [group, name] = key.split('.') as [string, string];
  const dict = UI as unknown as Record<string, Record<string, Localized>>;
  const value = dict[group]?.[name];
  if (!value) throw new Error(`ui-strings: unknown chrome key "${key}"`);
  return value;
}

/** Integer cents → localized USD at display time (the ONLY rounding point). */
export function formatCents(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

/**
 * Days-valued output lines (5e): their `amountCents` holds integer HUNDREDTHS
 * OF A DAY, never money — formatting them as USD would misstate a day count
 * as a price. Keyed here so the ResultPanel stays engine-agnostic.
 */
export const DAY_VALUED_KEYS = new Set(['maxExtraVacantDays']);

/** Integer hundredths of a day → localized "9.13 days" / "9.13 días". */
export function formatDayHundredths(hundredths: number, locale: Locale): string {
  const number = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(hundredths / 100);
  return `${number} ${t(UI.calc.daysUnit, locale)}`;
}

/** Enum field values → their chrome labels (labels are chrome, not content). */
export const ENUM_LABEL: Record<string, Localized> = {
  'miami-dade': UI.calcEnum.miamiDade,
  'other-fl': UI.calcEnum.otherFl,
  'single-family': UI.calcEnum.singleFamily,
  other: UI.calcEnum.otherClass,
};
