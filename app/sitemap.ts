import type { MetadataRoute } from 'next';
import { SITE_ORIGIN } from '@/config/origin';
import { href } from '@/lib/seo/href';
import {
  activeListings,
  isDiscoverable,
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
    // Marketed inventory plus the sold archive (sold pages keep their URLs
    // permanently). FIXTURES ARE EXCLUDED (4c): demonstration listings stay
    // routable but never enter a discovery surface.
    'listings.sold',
    ...activeListings()
      .filter(isDiscoverable)
      .map((l) => `listing.${l.slug}` as RouteId),
    ...soldListings()
      .filter(isDiscoverable)
      .map((l) => `listing.${l.slug}` as RouteId),
    // 7a: the index is a real published route; entity pages follow the same
    // 4c discovery contract as listings — fixtures never enter the sitemap.
    'neighborhoods',
    ...publishedNeighborhoods()
      .filter(isDiscoverable)
      .map((n) => `neighborhood.${n.slug}` as RouteId),
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
