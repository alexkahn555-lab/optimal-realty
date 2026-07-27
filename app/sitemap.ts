import type { MetadataRoute } from 'next';
import { SITE_ORIGIN } from '@/config/origin';
import { href } from '@/lib/seo/href';
import {
  activeListings,
  publishedPortals,
  publishedSubpages,
  publishedTools,
  publishedNeighborhoods,
  soldListings,
} from '@/lib/content/loaders';
import type { Locale, RouteId } from '@/lib/types';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const locales: Locale[] = ['en', 'es'];
  // Legal skeletons stay OUT until their attorney bodies resolve — an all-TK
  // page is not an indexable surface (same principle as the loaders' TK gate).
  const routeIds: RouteId[] = [
    'home',
    'contact',
    'about',
    'tools',
    'listings',
    ...publishedPortals().map((p) => `portal.${p.id}` as RouteId),
    ...publishedSubpages().map((s) => `subpage.${s.id}` as RouteId),
    ...publishedTools().map((t) => `tool.${t.id}` as RouteId),
    // Marketed inventory plus the sold archive (Phase 4b): sold pages keep
    // their URLs permanently, so they stay in the sitemap.
    'listings.sold',
    ...activeListings().map((l) => `listing.${l.slug}` as RouteId),
    ...soldListings().map((l) => `listing.${l.slug}` as RouteId),
    ...publishedNeighborhoods().map(
      (n) => `neighborhood.${n.slug}` as RouteId,
    ),
  ];
  const abs = (id: RouteId, locale: Locale) =>
    `${SITE_ORIGIN}${href(id, locale)}`;
  const entries: MetadataRoute.Sitemap = [];

  for (const id of routeIds) {
    for (const locale of locales) {
      entries.push({
        url: abs(id, locale),
        lastModified,
        alternates: {
          languages: {
            en: abs(id, 'en'),
            es: abs(id, 'es'),
            'x-default': abs(id, 'en'),
          },
        },
      });
    }
  }

  return entries;
}
