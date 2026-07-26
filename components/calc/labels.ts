import { UI } from '@/content/ui-strings';
import type { Localized } from '@/lib/types';

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

/** Enum field values → their chrome labels (labels are chrome, not content). */
export const ENUM_LABEL: Record<string, Localized> = {
  'miami-dade': UI.calcEnum.miamiDade,
  'other-fl': UI.calcEnum.otherFl,
  'single-family': UI.calcEnum.singleFamily,
  other: UI.calcEnum.otherClass,
};
