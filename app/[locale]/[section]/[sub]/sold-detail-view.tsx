import { SITE_ORIGIN } from '@/config/origin';
import { t } from '@/lib/i18n';
import type { Listing, Locale } from '@/lib/types';
import { href } from '@/lib/seo/href';
import { pageGraph, webPageNode } from '@/lib/seo/jsonld';
import { JsonLd } from '@/components/seo';
import { Section } from '@/components/primitives';
import { displayAddress } from '@/components/listing/helpers';
import { FactsTable } from '@/components/listing/FactsTable';
import { IdentityHeader } from '@/components/listing/IdentityHeader';
import { ListingAnswer } from '@/components/listing/ListingAnswer';
import { ListingBreadcrumbs } from '@/components/listing/ListingBreadcrumbs';
import { MediaGallery } from '@/components/listing/MediaGallery';
import { NarrativeBlock } from '@/components/listing/NarrativeBlock';
import { Scorecard } from '@/components/listing/Scorecard';
import { SoldBanner } from '@/components/listing/SoldBanner';

/**
 * SOLD DETAIL VIEW (D2) — a sold listing keeps its URL permanently but is a
 * RECORD, not an offer: it reuses M1–M4, M7, M8, M12 plus the
 * closed-transaction banner, and emits WebPage + BreadcrumbList ONLY — never
 * RealEstateListing, never an Offer (structured data offering unavailable
 * property is misleading and a manual-action risk). The active→sold flip is a
 * one-field status edit; this view and the Offer drop follow from it.
 * Dynamically imported by the [sub] router (same island-scoping rule as the
 * active report — this view still carries next/image + the lightbox shell).
 */
export function SoldDetailView({
  listing,
  locale,
}: {
  listing: Listing;
  locale: Locale;
}): JSX.Element {
  const url = `${SITE_ORIGIN}${href(`listing.${listing.slug}`, locale)}`;

  return (
    <Section className="py-16 md:py-24">
      <div className="space-y-10">
        <ListingBreadcrumbs listing={listing} locale={locale} /> {/* M1 */}
        <SoldBanner listing={listing} locale={locale} />
        <IdentityHeader listing={listing} locale={locale} /> {/* M2 */}
        <ListingAnswer listing={listing} locale={locale} /> {/* M3 */}
      </div>

      <div className="mt-12 gap-x-12 space-y-12 lg:grid lg:grid-cols-3 lg:space-y-0">
        <div className="space-y-12 lg:col-span-2">
          <MediaGallery listing={listing} locale={locale} /> {/* M4 + lightbox */}
          <NarrativeBlock listing={listing} locale={locale} /> {/* M12 */}
          <FactsTable listing={listing} locale={locale} /> {/* M8 */}
        </div>
        <aside className="space-y-12 lg:col-span-1">
          <Scorecard listing={listing} locale={locale} /> {/* M7 */}
        </aside>
      </div>

      <JsonLd
        graph={pageGraph([
          webPageNode(
            displayAddress(listing).heading,
            t(listing.summary, locale),
            url,
            locale,
            listing.dates.sold
          ),
        ])}
      />
    </Section>
  );
}
