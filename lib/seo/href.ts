import type { CalcId, Locale, PortalId, RouteId } from '@/lib/types';

/**
 * ============================================================================
 * ROUTE REGISTRY + href() — the ONLY legal internal URL constructor.
 * ============================================================================
 *
 * Raw string hrefs in JSX fail a custom lint rule (.eslintrc). Every internal
 * link in the app is built here so that:
 *   - localized segments stay in exactly one place (the reference route table), and
 *   - the roundtrip guarantee holds: for any route, the EN and ES URLs are both
 *     valid and mutually unique.
 *
 * The localized segments below ARE route-table data (structural URL slugs), not
 * rendered UI prose. The client-facing top-level segments come verbatim from the
 * dispatch reference table. Tool ES slugs are authored here with judgment and
 * FLAGGED in the completion report — no tool route renders in Phase 1.
 *
 * Entity-backed dynamic routes:
 *   - `listing.<slug>` / `neighborhood.<slug>` embed a locale-INVARIANT slug in
 *     the RouteId itself (addresses and place slugs do not translate) — composed
 *     directly, no content lookup required.
 *   - `subpage.<id>` is portal-parented with a Localized slug that lives in
 *     content. No subpages exist in Phase 1; calling href() for one throws until
 *     later phases wire subpage content. Drafts/stubs are invisible to routing.
 */

type LocalizedSeg = Record<Locale, string>;

/** Top-level localized path segments (the first segment after `/en` | `/es`). */
const PORTAL_SEG: Record<PortalId, LocalizedSeg> = {
  sellers: { en: 'sellers', es: 'vendedores' },
  buyers: { en: 'buyers', es: 'compradores' },
  investors: { en: 'investors', es: 'inversionistas' },
  landlords: { en: 'landlords', es: 'arrendadores' },
  tenants: { en: 'tenants', es: 'inquilinos' },
};

const SECTION_SEG = {
  tools: { en: 'tools', es: 'herramientas' },
  listings: { en: 'listings', es: 'propiedades' },
  neighborhoods: { en: 'neighborhoods', es: 'vecindarios' },
  about: { en: 'about', es: 'nosotros' },
  contact: { en: 'contact', es: 'contacto' },
  legal: { en: 'legal', es: 'legal' },
} satisfies Record<string, LocalizedSeg>;

/** Child segment for the sold-archive under listings. */
const SOLD_SEG: LocalizedSeg = { en: 'sold', es: 'vendidas' };

/** Legal subpage segments. */
const LEGAL_SEG: Record<'privacy' | 'terms' | 'disclosures' | 'accessibility', LocalizedSeg> = {
  privacy: { en: 'privacy', es: 'privacidad' },
  terms: { en: 'terms', es: 'terminos' },
  disclosures: { en: 'disclosures', es: 'divulgaciones' },
  accessibility: { en: 'accessibility', es: 'accesibilidad' },
};

/**
 * Tool URL slugs (closed CalcId set). ES slugs FLAGGED for client review — see
 * completion report. No tool route renders in Phase 1.
 */
const TOOL_SLUG: Record<CalcId, LocalizedSeg> = {
  'net-proceeds': { en: 'net-proceeds', es: 'ganancias-netas' },
  'tax-reset': { en: 'tax-reset', es: 'reajuste-de-impuestos' },
  'homestead-portability': { en: 'homestead-portability', es: 'portabilidad-de-homestead' },
  'condo-assessment': { en: 'condo-assessment', es: 'derrama-de-condominio' },
  'rental-cashflow': { en: 'rental-cashflow', es: 'flujo-de-caja-de-alquiler' },
  'vacancy-cost': { en: 'vacancy-cost', es: 'costo-de-vacancia' },
};

/** Join a base locale path with zero or more already-localized segments. */
function path(locale: Locale, ...segments: string[]): string {
  const tail = segments.filter(Boolean).join('/');
  return tail ? `/${locale}/${tail}` : `/${locale}`;
}

/**
 * The one legal internal URL constructor. Conforms to `HrefFn` in lib/types.ts.
 */
export function href(id: RouteId, locale: Locale): string {
  if (id === 'home') return path(locale);

  if (id === 'tools') return path(locale, SECTION_SEG.tools[locale]);
  if (id === 'listings') return path(locale, SECTION_SEG.listings[locale]);
  if (id === 'listings.sold')
    return path(locale, SECTION_SEG.listings[locale], SOLD_SEG[locale]);
  if (id === 'neighborhoods') return path(locale, SECTION_SEG.neighborhoods[locale]);
  if (id === 'about') return path(locale, SECTION_SEG.about[locale]);
  if (id === 'contact') return path(locale, SECTION_SEG.contact[locale]);

  if (id.startsWith('portal.')) {
    const pid = id.slice('portal.'.length) as PortalId;
    const seg = PORTAL_SEG[pid];
    if (!seg) throw new Error(`href: unknown portal "${pid}"`);
    return path(locale, seg[locale]);
  }

  if (id.startsWith('tool.')) {
    const calcId = id.slice('tool.'.length) as CalcId;
    const slug = TOOL_SLUG[calcId];
    if (!slug) throw new Error(`href: unknown tool "${calcId}"`);
    return path(locale, SECTION_SEG.tools[locale], slug[locale]);
  }

  if (id.startsWith('legal.')) {
    const child = id.slice('legal.'.length) as keyof typeof LEGAL_SEG;
    const seg = LEGAL_SEG[child];
    if (!seg) throw new Error(`href: unknown legal page "${child}"`);
    return path(locale, SECTION_SEG.legal[locale], seg[locale]);
  }

  // Locale-invariant slug embedded in the RouteId — composed directly.
  if (id.startsWith('listing.')) {
    const slug = id.slice('listing.'.length);
    return path(locale, SECTION_SEG.listings[locale], slug);
  }
  if (id.startsWith('neighborhood.')) {
    const slug = id.slice('neighborhood.'.length);
    return path(locale, SECTION_SEG.neighborhoods[locale], slug);
  }

  if (id.startsWith('subpage.')) {
    throw new Error(
      `href: subpage routes resolve from content (Localized slug + portal parent); ` +
        `no subpages exist in Phase 1. RouteId: "${id}"`
    );
  }

  // Every RouteId class is handled above; startsWith checks don't narrow the
  // union, so this line stays reachable to TypeScript. It should never run.
  throw new Error(`href: unhandled RouteId "${String(id)}"`);
}

/**
 * The fully-static route classes — every RouteId whose URL is computable without
 * content. Used by the sitemap-independent roundtrip test and available for
 * introspection. Entity-backed classes (subpage/tool/listing/neighborhood) are
 * excluded because their inventory is content-driven (empty in Phase 1).
 */
export const STATIC_ROUTE_IDS: RouteId[] = [
  'home',
  'portal.sellers',
  'portal.buyers',
  'portal.investors',
  'portal.landlords',
  'portal.tenants',
  'tools',
  'listings',
  'listings.sold',
  'neighborhoods',
  'about',
  'contact',
  'legal.privacy',
  'legal.terms',
  'legal.disclosures',
  'legal.accessibility',
];
