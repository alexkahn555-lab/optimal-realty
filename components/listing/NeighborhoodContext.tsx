import { localizedClean, publishedNeighborhoods } from '@/lib/content/loaders';
import { t } from '@/lib/i18n';
import { href } from '@/lib/seo/href';
import type { Listing, Locale } from '@/lib/types';
import { Heading, Prose } from '@/components/primitives';

import { LISTING_UI } from './strings';

/**
 * M11 — neighborhood context. Resolves listing.neighborhoodId against the
 * PUBLISHED neighborhood registry and renders null when unresolved — which is
 * every render until Phase 7 ships the neighborhood engine (no neighborhoods
 * exist; the fixtures carry no neighborhoodId). The module is real so Phase 7
 * content lights it up without touching this file: name links to the
 * neighborhood page, the answer line renders, TK overview stays absent.
 */
export function NeighborhoodContext({
  listing,
  locale,
}: {
  listing: Listing;
  locale: Locale;
}): JSX.Element | null {
  if (listing.neighborhoodId === undefined) return null;
  const neighborhood = publishedNeighborhoods().find(
    (n) => n.id === listing.neighborhoodId
  );
  if (!neighborhood) return null;

  return (
    <section>
      <Heading level={2}>{t(LISTING_UI.neighborhood.heading, locale)}</Heading>
      <p className="mt-4">
        <a
          className="font-display text-xl text-ink underline"
          href={href(`neighborhood.${neighborhood.slug}`, locale)}
        >
          {t(neighborhood.name, locale)}
        </a>
      </p>
      <div className="mt-2">
        <Prose>
          <p>{t(neighborhood.answer.answer, locale)}</p>
        </Prose>
      </div>
      {localizedClean(neighborhood.overview) ? (
        <div className="mt-2">
          <Prose>
            <p>{t(neighborhood.overview, locale)}</p>
          </Prose>
        </div>
      ) : null}
    </section>
  );
}
