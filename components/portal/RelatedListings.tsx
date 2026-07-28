import { UI } from '@/content/ui-strings';
import { t } from '@/lib/i18n';
import { href } from '@/lib/seo/href';
import { isDiscoverable, publishedListings } from '@/lib/content/loaders';
import { Heading } from '@/components/primitives';
import type { Locale, ListingStatus } from '@/lib/types';

/**
 * RELATED LISTINGS (Part 7.2 slot 7) — the featured-listings proof rail.
 * Renders NULL when nothing matches the mode. Demonstration fixtures are
 * EXCLUDED here (5d, extending 4c): a rail on a hub, subpage or the home page
 * is where proof of a real deal sits, and a fabricated listing or closed
 * transaction may not occupy that position. A fixture stays visible on the
 * listings index and on its own page, where it carries its banner. Real
 * listings light this rail up without touching this file. Full listing cards
 * belong to components/listing/** (Phase 4) — this slot links.
 */

export interface RelatedListingsProps {
  mode: 'active' | 'sold' | 'leased';
  limit: number;
  locale: Locale;
}

const MODE_STATUSES: Record<RelatedListingsProps['mode'], ListingStatus[]> = {
  active: ['active', 'coming-soon'],
  sold: ['sold'],
  leased: ['leased'],
};

export function RelatedListings({
  mode,
  limit,
  locale,
}: RelatedListingsProps): JSX.Element | null {
  const listings = publishedListings()
    .filter(isDiscoverable)
    .filter((listing) => MODE_STATUSES[mode].includes(listing.status))
    .slice(0, limit);
  if (listings.length === 0) return null;

  return (
    <section>
      <Heading level={2}>{t(UI.sections.featuredListings, locale)}</Heading>
      <ul className="mt-6">
        {listings.map((listing) => (
          <li key={listing.id} className="border-b border-hair">
            <a
              className="block py-4 font-sans text-ink"
              href={href(`listing.${listing.slug}`, locale)}
            >
              {t(listing.summary, locale)}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
