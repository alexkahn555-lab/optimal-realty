import { activeListings } from '@/lib/content/loaders';
import { t } from '@/lib/i18n';
import { href } from '@/lib/seo/href';
import type { Listing, Locale } from '@/lib/types';
import { Heading } from '@/components/primitives';

import { bathsTotal, displayAddress, formatNumber, formatPriceUsd } from './helpers';
import { LISTING_UI } from './strings';

/**
 * Similar listings — derived, never authored: currently-marketed listings in
 * the same neighborhood (when both carry one) or the same property class,
 * excluding the listing itself, capped at 3. Zero JS, no images (text rows —
 * the report's image weight belongs to the subject property). Null when
 * nothing matches. Sold listings are never suggested: "similar" implies
 * available.
 */
const CAP = 3;

/** Pure selector — exported for tests. */
export function similarTo(listing: Listing, candidates: Listing[]): Listing[] {
  const seen = new Set<string>([listing.slug]);
  const out: Listing[] = [];
  for (const candidate of candidates) {
    if (seen.has(candidate.slug)) continue;
    const sameNeighborhood =
      listing.neighborhoodId !== undefined &&
      candidate.neighborhoodId === listing.neighborhoodId;
    if (sameNeighborhood || candidate.class === listing.class) {
      seen.add(candidate.slug);
      out.push(candidate);
      if (out.length === CAP) break;
    }
  }
  return out;
}

export function SimilarListings({
  listing,
  locale,
}: {
  listing: Listing;
  locale: Locale;
}): JSX.Element | null {
  const matches = similarTo(listing, activeListings());
  if (matches.length === 0) return null;

  return (
    <section>
      <Heading level={2}>{t(LISTING_UI.similar.heading, locale)}</Heading>
      <ul className="mt-4">
        {matches.map((match) => {
          const address = displayAddress(match);
          const facts = [
            `${formatNumber(match.facts.beds, locale)} ${t(LISTING_UI.rail.beds, locale)}`,
            `${formatNumber(bathsTotal(match), locale)} ${t(LISTING_UI.rail.baths, locale)}`,
            `${formatNumber(match.facts.sqft, locale)} ${t(LISTING_UI.rail.sqft, locale)}`,
          ].join(' · ');
          return (
            <li key={match.id} className="border-b border-hair">
              <a
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3"
                href={href(`listing.${match.slug}`, locale)}
              >
                <span className="font-sans text-ink underline">
                  {address.heading}
                </span>
                <span className="font-mono text-sm tabular-nums text-ink">
                  {`${formatPriceUsd(match.price, locale)} · ${facts}`}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
