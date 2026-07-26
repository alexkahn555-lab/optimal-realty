import { SITE_ORIGIN } from '@/config/origin';
import { UI } from '@/content/ui-strings';
import { t } from '@/lib/i18n';
import type { Locale } from '@/lib/types';
import { activeListings } from '@/lib/content/loaders';
import { href } from '@/lib/seo/href';
import { collectionPageNode, itemListNode, pageGraph } from '@/lib/seo/jsonld';
import { Breadcrumbs, JsonLd } from '@/components/seo';
import { Heading, Section } from '@/components/primitives';
import { ListingCard } from '@/components/listing/ListingCard';
import { displayAddress } from '@/components/listing/helpers';
import { LISTING_UI } from '@/components/listing/strings';

/**
 * LISTINGS INDEX VIEW (D3) — dynamically imported by the [section] router so
 * the next/image client chunk is scoped to the index URL and never rides into
 * the form-less section pages that share the page entry (Part 8 import-graph
 * discipline). Renders published ACTIVE fixtures only (activeListings — the
 * sold archive is Phase 4b). First card is the LCP: priority/eager; the rest
 * lazy. JSON-LD: CollectionPage + ItemList here, BreadcrumbList via the
 * Breadcrumbs component.
 */
export function ListingsIndexView({ locale }: { locale: Locale }): JSX.Element {
  const listings = activeListings();
  const url = `${SITE_ORIGIN}${href('listings', locale)}`;

  return (
    <Section className="py-16 md:py-24">
      <div className="space-y-12">
        <Breadcrumbs
          items={[
            { id: 'home', label: UI.breadcrumb.home },
            { id: 'listings', label: UI.nav.listings },
          ]}
          locale={locale}
        />
        <div>
          <Heading level={1}>{t(UI.nav.listings, locale)}</Heading>
          <p className="mt-4 max-w-prose font-sans leading-relaxed text-ink">
            {t(LISTING_UI.index.intro, locale)}
          </p>
        </div>
        <ul className="grid gap-10 md:grid-cols-2">
          {listings.map((listing, index) => (
            <li key={listing.id}>
              <ListingCard
                listing={listing}
                locale={locale}
                priority={index === 0}
              />
            </li>
          ))}
        </ul>
      </div>
      <JsonLd
        graph={pageGraph([
          collectionPageNode(UI.nav.listings, LISTING_UI.index.intro, url, locale),
          itemListNode(
            listings.map((listing) => ({
              name: displayAddress(listing).heading,
              url: `${SITE_ORIGIN}${href(`listing.${listing.slug}`, locale)}`,
            })),
            url
          ),
        ])}
      />
    </Section>
  );
}
