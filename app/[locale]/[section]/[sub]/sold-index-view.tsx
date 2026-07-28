import { SITE_ORIGIN } from '@/config/origin';
import { UI } from '@/content/ui-strings';
import { t } from '@/lib/i18n';
import type { Locale } from '@/lib/types';
import { localizedClean, soldListings } from '@/lib/content/loaders';
import { href } from '@/lib/seo/href';
import { collectionPageNode, itemListNode, pageGraph } from '@/lib/seo/jsonld';
import { Breadcrumbs, JsonLd, PlaceholderTK } from '@/components/seo';
import { Heading, Section } from '@/components/primitives';
import { ListingCard } from '@/components/listing/ListingCard';
import { displayAddress } from '@/components/listing/helpers';
import { LISTING_UI } from '@/components/listing/strings';

/**
 * SOLD INDEX VIEW (D2) — /en/listings/sold · /es/propiedades/vendidas.
 * Lives in the [sub] router (the URL is two segments deep). Same JSON-LD
 * shape as the active index: CollectionPage + ItemList here, BreadcrumbList
 * via the Breadcrumbs component. Cards reuse the 4a ListingCard (its status
 * tag shows nothing for sold — the page context is the label; the card grid
 * stays value-neutral).
 */
export function SoldIndexView({ locale }: { locale: Locale }): JSX.Element {
  const listings = soldListings();
  const url = `${SITE_ORIGIN}${href('listings.sold', locale)}`;

  return (
    <Section className="py-16 md:py-24">
      <div className="space-y-12">
        <Breadcrumbs
          items={[
            { id: 'home', label: UI.breadcrumb.home },
            { id: 'listings', label: UI.nav.listings },
            { id: 'listings.sold', label: LISTING_UI.sold.indexTitle },
          ]}
          locale={locale}
        />
        <div>
          <Heading level={1}>{t(LISTING_UI.sold.indexTitle, locale)}</Heading>
          {/* Client-reviewed intro (4c): placeholder until supplied. */}
          {localizedClean(LISTING_UI.sold.indexIntro) ? (
            <p className="mt-4 max-w-prose font-sans leading-relaxed text-ink">
              {t(LISTING_UI.sold.indexIntro, locale)}
            </p>
          ) : (
            <div className="mt-4">
              <PlaceholderTK id="SOLD_INDEX_INTRO" />
            </div>
          )}
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
          collectionPageNode(
            LISTING_UI.sold.indexTitle,
            LISTING_UI.sold.indexIntro,
            url,
            locale
          ),
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
