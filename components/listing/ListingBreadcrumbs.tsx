import { UI } from '@/content/ui-strings';
import type { Listing, Locale } from '@/lib/types';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';

import { displayAddress } from './helpers';

/**
 * M1 — listing-report breadcrumbs (route module). Home / Listings / <listing>.
 * The BreadcrumbList JSON-LD is emitted by the shared Breadcrumbs component;
 * the page graph must NOT emit a second one. The leaf label runs through
 * displayAddress, so a privacy-degraded listing breadcrumbs as its city/zip
 * form — never the street line.
 */
export function ListingBreadcrumbs({
  listing,
  locale,
}: {
  listing: Listing;
  locale: Locale;
}): JSX.Element {
  const { heading } = displayAddress(listing);
  return (
    <Breadcrumbs
      items={[
        { id: 'home', label: UI.breadcrumb.home },
        { id: 'listings', label: UI.nav.listings },
        // Addresses are locale-invariant; the label is the same in both locales.
        { id: `listing.${listing.slug}`, label: { en: heading, es: heading } },
      ]}
      locale={locale}
    />
  );
}
