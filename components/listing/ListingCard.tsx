import { t } from '@/lib/i18n';
import { href } from '@/lib/seo/href';
import type { Listing, Locale } from '@/lib/types';
import { Tag } from '@/components/primitives';

import { bathsTotal, displayAddress, formatNumber, formatPriceUsd } from './helpers';
import { MediaImage } from './MediaImage';
import { LISTING_STATUS_LABEL, LISTING_UI } from './strings';

/**
 * Index card (D3). Zero JS. Hero asset at a 400w 3:2 crop (the assets are
 * produced 3:2 by the media pipeline; aspect-ratio + object-cover guard the
 * crop if a future asset isn't); the FIRST card on the page is the index LCP
 * and renders priority/eager, the rest lazy-load. Address and facts run
 * through the same helpers as the report, so privacy degradation is
 * everywhere-consistent.
 */
export function ListingCard({
  listing,
  locale,
  priority = false,
}: {
  listing: Listing;
  locale: Locale;
  priority?: boolean;
}): JSX.Element | null {
  const hero = listing.media[0];
  if (!hero) return null;

  const address = displayAddress(listing);
  const statusLabel = LISTING_STATUS_LABEL[listing.status];
  const facts = [
    `${formatNumber(listing.facts.beds, locale)} ${t(LISTING_UI.rail.beds, locale)}`,
    `${formatNumber(bathsTotal(listing), locale)} ${t(LISTING_UI.rail.baths, locale)}`,
    `${formatNumber(listing.facts.sqft, locale)} ${t(LISTING_UI.rail.sqft, locale)}`,
  ].join(' · ');

  return (
    <a
      className="group block border-b border-hair pb-6"
      href={href(`listing.${listing.slug}`, locale)}
    >
      <div className="aspect-[3/2] overflow-hidden">
        <MediaImage
          asset={hero}
          locale={locale}
          priority={priority}
          sizes="(min-width: 768px) 400px, 100vw"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <span className="font-display text-xl text-ink group-hover:underline">
          {address.heading}
        </span>
        {statusLabel ? <Tag>{t(statusLabel, locale)}</Tag> : null}
      </div>
      {address.full ? (
        <p className="mt-1 font-sans text-sm text-ink">{address.cityLine}</p>
      ) : null}
      <p className="mt-2 font-mono text-2xl tabular-nums text-ink">
        {formatPriceUsd(listing.price, locale)}
      </p>
      <p className="mt-1 font-mono text-xs uppercase tracking-wider text-marine">
        {facts}
      </p>
    </a>
  );
}
