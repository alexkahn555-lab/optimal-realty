import { t } from '@/lib/i18n';
import type { Listing, Locale } from '@/lib/types';
import { Heading } from '@/components/primitives';

import { displayAddress } from './helpers';
import { MapEmbed } from './MapEmbedLazy';
import { LISTING_UI } from './strings';

/**
 * M10 — map facade. A static facade until click; the OpenStreetMap iframe
 * loads only on interaction (the embed is the report's single largest
 * third-party LCP threat — it must never be eager). PRIVACY: a map pin is an
 * address; when showFullAddress is false this module renders null — the same
 * rule that withholds GeoCoordinates from the JSON-LD.
 */
export function MapFacade({
  listing,
  locale,
}: {
  listing: Listing;
  locale: Locale;
}): JSX.Element | null {
  if (!listing.showFullAddress) return null;

  const address = displayAddress(listing);

  return (
    <section>
      <Heading level={2}>{t(LISTING_UI.map.heading, locale)}</Heading>
      <div className="mt-4">
        <MapEmbed
          lat={listing.geo.lat}
          lng={listing.geo.lng}
          label={`${address.heading} · ${address.cityLine}`}
          loadLabel={t(LISTING_UI.map.load, locale)}
          sourceLabel={t(LISTING_UI.map.source, locale)}
          iframeTitle={t(LISTING_UI.map.iframeTitle, locale)}
        />
      </div>
    </section>
  );
}
