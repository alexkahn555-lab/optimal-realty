import { t } from '@/lib/i18n';
import type { Listing, Locale } from '@/lib/types';
import { Heading } from '@/components/primitives';

import { Lightbox } from './LightboxLazy';
import { MediaImage } from './MediaImage';
import { LISTING_UI } from './strings';

/**
 * M4 — media gallery. media[0] is the LCP image — rendered with priority
 * (preload + eager) and explicit dimensions; every other asset lazy-loads
 * (next/image default).
 *
 * Phase 4b filled the 4a seam: the tiles are wrapped by the Lightbox SHELL
 * (via the LightboxLazy client boundary — never a static island import). The
 * server-rendered gallery markup is unchanged; the shell captures clicks and
 * fetches the overlay chunk on FIRST CLICK only (Part 8: the overlay is never
 * initial-load JS on any route).
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
      <Lightbox
        assets={listing.media.map((asset) => ({
          src: asset.src,
          w: asset.w,
          h: asset.h,
          alt: t(asset.alt, locale),
        }))}
        labels={{
          close: t(LISTING_UI.lightbox.close, locale),
          prev: t(LISTING_UI.lightbox.prev, locale),
          next: t(LISTING_UI.lightbox.next, locale),
        }}
      >
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
      </Lightbox>
    </section>
  );
}
