import { expect, test } from '@playwright/test';
import {
  activeListings,
  publishedNeighborhoods,
  publishedPortals,
  publishedSubpages,
  publishedTools,
  soldListings,
} from '../lib/content/loaders';
import { LEGAL_SLUGS } from '../content/legal';
import { href } from '../lib/seo/href';
import type { RouteId } from '../lib/types';

/**
 * Dispatch 6a — THE RAW-MARKER GATE. Walks every published route in both
 * locales and asserts the SERVED document contains zero raw TK_ strings —
 * prose, head, JSON-LD, and the RSC flight payload (React keys serialize
 * there, invisible to renderToStaticMarkup: the 5c lesson).
 *
 * The route list derives from the SAME loaders the sitemap uses, so a new
 * route is covered automatically. It is deliberately BROADER than the
 * sitemap: legal skeletons and demonstration fixtures are excluded from
 * discovery surfaces but their pages still serve, and a served page may never
 * carry a raw marker regardless of discoverability.
 */

const ROUTE_IDS: RouteId[] = [
  'home',
  'contact',
  'about',
  'tools',
  'listings',
  'listings.sold',
  'neighborhoods',
  ...publishedPortals().map((p) => `portal.${p.id}` as RouteId),
  ...publishedSubpages().map((s) => `subpage.${s.id}` as RouteId),
  ...publishedTools().map((t) => `tool.${t.id}` as RouteId),
  ...LEGAL_SLUGS.map((slug) => `legal.${slug}` as RouteId),
  // Routable beyond the sitemap: fixture listings and fixture neighborhoods
  // serve behind their demonstration banners (stubs do not exist as routes).
  ...[...activeListings(), ...soldListings()].map(
    (l) => `listing.${l.slug}` as RouteId
  ),
  ...publishedNeighborhoods().map((n) => `neighborhood.${n.slug}` as RouteId),
];

const PATHS = ROUTE_IDS.flatMap((id) =>
  (['en', 'es'] as const).map((locale) => href(id, locale))
);

test('the walker covers every route class (loader-derived, non-trivial)', () => {
  // A refactor that empties the loaders must fail HERE, not silently shrink
  // the walk: 16 static/legal routes + 5 portals·2 + 5 subpages·2 + 5 tools·2
  // + 3 listings·2 = at least 48 paths today.
  expect(PATHS.length).toBeGreaterThanOrEqual(48);
  expect(PATHS).toContain('/en/legal/privacy'); // not in the sitemap
  expect(PATHS).toContain('/es/propiedades/100-fixture-boulevard-coral-gables');
});

for (const path of PATHS) {
  test(`${path} serves zero raw TK_ markers`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status(), `${path} must serve`).toBe(200);
    const html = await page.content();
    const markers = html.match(/\bTK_[A-Z0-9_]*/g);
    expect(
      markers,
      `${path} served raw marker(s): ${[...new Set(markers ?? [])].join(', ')}`
    ).toBeNull();
  });
}
