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
import { IdentityHeader } from '@/components/listing/IdentityHeader';
import { ListingAnswer } from '@/components/listing/ListingAnswer';
import { ListingBreadcrumbs } from '@/components/listing/ListingBreadcrumbs';
import { MediaGallery } from '@/components/listing/MediaGallery';

/**
 * LISTING REPORT VIEW (D4) — dynamically imported by the [sub] router so the
 * report's client chunks (next/image + the LeadForm island via LeadFormLazy)
 * are scoped to listing URLs and never ride into legal/tool/subpage documents
 * sharing the page entry (Part 8). LeadCta comes from its concrete file, never
 * the portal barrel.
 *
 * Module contract (Part 7.3): (listing, locale) => Section | null — a module
 * with absent data renders null and the report degrades BY OMISSION, never by
 * placeholder text. Phase 4a composes the SHIPPABLE CORE only (M1 breadcrumbs,
 * M2 identity, M3 answer, M4 gallery, M6 costs, M8 facts, M14 lead +
 * disclosure) into the three-zone grid; the commented seams below are where
 * the Phase 4b modules slot without re-layout.
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
        <ListingBreadcrumbs listing={listing} locale={locale} /> {/* M1 */}
        <IdentityHeader listing={listing} locale={locale} /> {/* M2 */}
        <ListingAnswer listing={listing} locale={locale} /> {/* M3 */}
      </div>

      <div className="mt-12 gap-x-12 space-y-12 lg:grid lg:grid-cols-3 lg:space-y-0">
        {/* ZONE 2 — evidence column. */}
        <div className="space-y-12 lg:col-span-2">
          <MediaGallery listing={listing} locale={locale} /> {/* M4 (lightbox seam in-module) */}
          {/* 4b seams — M5 PriceSqftChart · M12 Narrative · M9 FeatureGroups ·
              M11 NeighborhoodContext · M13 ListingFaq: modules render null by
              contract and slot here in order. */}
          <FactsTable listing={listing} locale={locale} /> {/* M8 */}
        </div>

        {/* ZONE 3 — decision rail. */}
        <aside className="space-y-12 lg:col-span-1">
          <CostBreakdown listing={listing} locale={locale} /> {/* M6 */}
          {/* 4b seams — M7 Scorecard · M10 MapFacade slot here. */}
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
