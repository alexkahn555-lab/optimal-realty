import { t } from '@/lib/i18n';
import type { Listing, Locale } from '@/lib/types';
import { Heading, Tag } from '@/components/primitives';

import { bathsTotal, displayAddress, formatNumber, formatPriceUsd } from './helpers';
import { LISTING_STATUS_LABEL, LISTING_UI } from './strings';

/**
 * M2 — identity header. Zero JS. Address heading (degraded per the
 * showFullAddress privacy flag), single-color status tag (value-neutral —
 * Part 1.4: no color encodes place, price tier, or desirability), mono price
 * rail, and the four-fact mono rail (beds · baths · sqft · built).
 */
export function IdentityHeader({
  listing,
  locale,
}: {
  listing: Listing;
  locale: Locale;
}): JSX.Element {
  const address = displayAddress(listing);
  const statusLabel = LISTING_STATUS_LABEL[listing.status];
  const facts = listing.facts;

  const rail = [
    `${formatNumber(facts.beds, locale)} ${t(LISTING_UI.rail.beds, locale)}`,
    `${formatNumber(bathsTotal(listing), locale)} ${t(LISTING_UI.rail.baths, locale)}`,
    `${formatNumber(facts.sqft, locale)} ${t(LISTING_UI.rail.sqft, locale)}`,
    `${t(LISTING_UI.rail.built, locale)} ${facts.yearBuilt}`,
  ].join(' · ');

  return (
    <header>
      {statusLabel ? <Tag>{t(statusLabel, locale)}</Tag> : null}
      <Heading level={1} className="mt-2">
        {address.heading}
      </Heading>
      {/* The locality line only repeats when the street heading is shown. */}
      {address.full ? (
        <p className="mt-1 font-sans text-ink">{address.cityLine}</p>
      ) : (
        <p className="mt-1 font-sans text-ink">
          {t(LISTING_UI.identity.addressWithheld, locale)}
        </p>
      )}
      <p className="mt-6 font-mono text-4xl tabular-nums text-ink md:text-5xl">
        {formatPriceUsd(listing.price, locale)}
      </p>
      <p className="mt-3 font-mono text-sm uppercase tracking-wider text-marine">
        {rail}
      </p>
    </header>
  );
}
