import { t } from '@/lib/i18n';
import { localizedClean } from '@/lib/content/loaders';
import type { Listing, Locale } from '@/lib/types';

/**
 * M3 — answer block. Zero JS. Renders the auto-templated `summary` sentence
 * (price, class, beds, baths, sqft, city — structural, generated at authoring,
 * NOT free copy) in the answer-block register: set apart by scale, never a
 * tinted box. Renders null if the summary is absent or still TK — the report
 * degrades by omission, never by placeholder.
 */
export function ListingAnswer({
  listing,
  locale,
}: {
  listing: Listing;
  locale: Locale;
}): JSX.Element | null {
  if (!localizedClean(listing.summary)) return null;
  const text = t(listing.summary, locale).trim();
  if (text.length === 0) return null;

  return (
    <p className="max-w-prose font-display text-xl leading-relaxed text-ink md:text-2xl">
      {text}
    </p>
  );
}
