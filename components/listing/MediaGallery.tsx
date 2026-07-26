import { t } from '@/lib/i18n';
import type { Listing, Locale } from '@/lib/types';
import { Heading } from '@/components/primitives';

import { MediaImage } from './MediaImage';
import { LISTING_UI } from './strings';

/**
 * M4 — media gallery. STATIC this phase: zero JS, no lightbox. media[0] is the
 * LCP image — rendered with priority (preload + eager) and explicit
 * dimensions; every other asset lazy-loads (next/image default).
 *
 * PHASE 4B SEAM — the lightbox island mounts here via a dynamic-import client
 * boundary (LightboxLazy, mirroring LeadFormLazy), wrapping the tiles below.
 * Nothing else in this module changes when it lands; do NOT import the island
 * statically (Part 8: the gallery must stay out of the shared page entry).
 */
export function MediaGallery({
  listing,
  locale,
}: {
  listing: Listing;
  locale: Locale;
}): JSX.Element | null {
  const [hero, ...rest] = listing.media;
  if (!hero) return null;

  return (
    <section>
      <Heading level={2} className="sr-only">
        {t(LISTING_UI.gallery.heading, locale)}
      </Heading>
      <MediaImage
        asset={hero}
        locale={locale}
        priority
        sizes="(min-width: 1024px) 640px, 100vw"
        className="h-auto w-full"
      />
      {rest.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-4">
          {rest.map((asset) => (
            <li key={asset.src}>
              <MediaImage
                asset={asset}
                locale={locale}
                sizes="(min-width: 1024px) 320px, 50vw"
                className="h-auto w-full"
              />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
