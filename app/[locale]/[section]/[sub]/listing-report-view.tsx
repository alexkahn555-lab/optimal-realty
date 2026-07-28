import { SITE_ORIGIN } from '@/config/origin';
import type { LeadIntent, Listing, Locale } from '@/lib/types';
import { href } from '@/lib/seo/href';
import { pageGraph, realEstateListingNode } from '@/lib/seo/jsonld';
import { JsonLd } from '@/components/seo';
import { Section } from '@/components/primitives';
import { LeadCta } from '@/components/portal/LeadCta';
import { CostBreakdown } from '@/components/listing/CostBreakdown';
import { DisclosureBlock } from '@/components/listing/DisclosureBlock';
import { FactsTable } from '@/components/listing/FactsTable';
import { FixtureBanner } from '@/components/listing/FixtureBanner';
import { FeatureGroups } from '@/components/listing/FeatureGroups';
import { IdentityHeader } from '@/components/listing/IdentityHeader';
import { ListingAnswer } from '@/components/listing/ListingAnswer';
import { ListingBreadcrumbs } from '@/components/listing/ListingBreadcrumbs';
import { ListingFaq } from '@/components/listing/ListingFaq';
import { MapFacade } from '@/components/listing/MapFacade';
import { MediaGallery } from '@/components/listing/MediaGallery';
import { NarrativeBlock } from '@/components/listing/NarrativeBlock';
import { NeighborhoodContext } from '@/components/listing/NeighborhoodContext';
import { PriceHistoryChart } from '@/components/listing/PriceHistoryChart';
import { Scorecard } from '@/components/listing/Scorecard';
import { SimilarListings } from '@/components/listing/SimilarListings';

/**
 * LISTING REPORT VIEW — dynamically imported by the [sub] router so the
 * report's client chunks (next/image, the LeadForm island, the lightbox
 * shell, the map facade — all via their lazy boundaries) are scoped to
 * listing URLs and never ride into legal/tool/subpage documents sharing the
 * page entry (Part 8). LeadCta comes from its concrete file, never the barrel.
 *
 * Module contract (Part 7.3): (listing, locale) => Section | null — absent
 * data renders null and the report degrades BY OMISSION. Phase 4b completed
 * the module set; M11 renders null until Phase 7 registers neighborhoods.
 */
export function ListingReportView({
  listing,
  locale,
}: {
  listing: Listing;
  locale: Locale;
}): JSX.Element {
  const url = `${SITE_ORIGIN}${href(`listing.${listing.slug}`, locale)}`;
  const intent: LeadIntent = listing.offerType === 'sale' ? 'buy' : 'rent';

  return (
    <Section className="py-16 md:py-24">
      {/* ZONE 1 — identity: full-width answer-first header. */}
      <div className="space-y-10">
        <FixtureBanner listing={listing} locale={locale} /> {/* fixture truth label */}
        <ListingBreadcrumbs listing={listing} locale={locale} /> {/* M1 */}
        <IdentityHeader listing={listing} locale={locale} /> {/* M2 */}
        <ListingAnswer listing={listing} locale={locale} /> {/* M3 */}
      </div>

      <div className="mt-12 gap-x-12 space-y-12 lg:grid lg:grid-cols-3 lg:space-y-0">
        {/* ZONE 2 — evidence column. */}
        <div className="space-y-12 lg:col-span-2">
          <MediaGallery listing={listing} locale={locale} /> {/* M4 + lightbox */}
          <PriceHistoryChart listing={listing} locale={locale} /> {/* M5 */}
          <NarrativeBlock listing={listing} locale={locale} /> {/* M12 */}
          <FeatureGroups listing={listing} locale={locale} /> {/* M9 */}
          <FactsTable listing={listing} locale={locale} /> {/* M8 */}
          <NeighborhoodContext listing={listing} locale={locale} /> {/* M11 — null until Phase 7 */}
          <ListingFaq listing={listing} locale={locale} /> {/* M13 */}
          <SimilarListings listing={listing} locale={locale} />
        </div>

        {/* ZONE 3 — decision rail. */}
        <aside className="space-y-12 lg:col-span-1">
          <CostBreakdown listing={listing} locale={locale} /> {/* M6 */}
          <Scorecard listing={listing} locale={locale} /> {/* M7 */}
          <MapFacade listing={listing} locale={locale} /> {/* M10 */}
          <div>
            <LeadCta
              locale={locale}
              sourceType="listing"
              sourceSlug={listing.slug}
              intent={intent}
            />
            {/* M14 */}
            <div className="mt-10">
              <DisclosureBlock locale={locale} />
            </div>
          </div>
        </aside>
      </div>

      <JsonLd graph={pageGraph([realEstateListingNode(listing, url, locale)])} />
    </Section>
  );
}
