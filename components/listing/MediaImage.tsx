import { t } from '@/lib/i18n';
import type { Locale, MediaAsset } from '@/lib/types';

import { MediaImageIsland } from './MediaImageLazy';

/**
 * MediaImage (RSC) — the ONLY way listing modules render a MediaAsset.
 * The wrapper narrows next/image to the Part 8.3 contract:
 *   - `sizes` is REQUIRED (a fill-viewport default silently over-fetches);
 *   - alt is the asset's Localized alt, resolved here — a raw string cannot
 *     be passed, so every rendered image carries the authored description of
 *     what it actually shows;
 *   - explicit width/height from the asset (CLS-proof; validated upstream);
 *   - quality fixed at 65, AVIF primary + WebP fallback via next.config
 *     `images.formats`;
 *   - `unoptimized` is BANNED: it is not a prop anywhere in this chain, so it
 *     cannot reach next/image through this wrapper.
 * The underlying next/image runtime enters through the MediaImageLazy client
 * boundary so it never leaks into shared page entries (Part 8).
 */

const QUALITY = 65;

export interface MediaImageProps {
  asset: MediaAsset;
  locale: Locale;
  /** Required responsive-width hint, e.g. "(min-width: 768px) 400px, 100vw". */
  sizes: string;
  /** LCP images only (media[0] hero, first index card): preload + eager. */
  priority?: boolean;
  className?: string;
}

export function MediaImage({
  asset,
  locale,
  sizes,
  priority = false,
  className,
}: MediaImageProps): JSX.Element {
  return (
    <MediaImageIsland
      src={asset.src}
      width={asset.w}
      height={asset.h}
      alt={t(asset.alt, locale)}
      sizes={sizes}
      quality={QUALITY}
      priority={priority}
      className={className}
    />
  );
}
