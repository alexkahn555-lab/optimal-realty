import { describe, expect, it } from 'vitest';
import { href, STATIC_ROUTE_IDS } from '@/lib/seo/href';

describe('href()', () => {
  it('home maps to bare locale paths', () => {
    expect(href('home', 'en')).toBe('/en');
    expect(href('home', 'es')).toBe('/es');
  });

  it('every static route is locale-prefixed', () => {
    for (const id of STATIC_ROUTE_IDS) {
      expect(href(id, 'en').startsWith('/en')).toBe(true);
      expect(href(id, 'es').startsWith('/es')).toBe(true);
    }
  });

  it('EN and ES URLs differ for every static route', () => {
    for (const id of STATIC_ROUTE_IDS) {
      expect(href(id, 'en')).not.toBe(href(id, 'es'));
    }
  });

  it('URLs are unique within each locale', () => {
    const en = STATIC_ROUTE_IDS.map((id) => href(id, 'en'));
    const es = STATIC_ROUTE_IDS.map((id) => href(id, 'es'));
    expect(new Set(en).size).toBe(en.length);
    expect(new Set(es).size).toBe(es.length);
  });

  it('localized section segments', () => {
    expect(href('portal.sellers', 'en')).toBe('/en/sellers');
    expect(href('portal.sellers', 'es')).toBe('/es/vendedores');
    expect(href('tools', 'es')).toBe('/es/herramientas');
    expect(href('listings', 'es')).toBe('/es/propiedades');
    expect(href('neighborhoods', 'es')).toBe('/es/vecindarios');
    expect(href('about', 'es')).toBe('/es/nosotros');
    expect(href('contact', 'es')).toBe('/es/contacto');
  });

  it('the four remaining portal hubs round-trip both locales (5c route map)', () => {
    expect(href('portal.buyers', 'en')).toBe('/en/buyers');
    expect(href('portal.buyers', 'es')).toBe('/es/compradores');
    expect(href('portal.investors', 'en')).toBe('/en/investors');
    expect(href('portal.investors', 'es')).toBe('/es/inversionistas');
    // ES slug per the 5c dispatch route map (supersedes the Phase 1 judgment
    // slug 'arrendadores').
    expect(href('portal.landlords', 'en')).toBe('/en/landlords');
    expect(href('portal.landlords', 'es')).toBe('/es/propietarios');
    expect(href('portal.tenants', 'en')).toBe('/en/tenants');
    expect(href('portal.tenants', 'es')).toBe('/es/inquilinos');
  });

  it('legal + sold children', () => {
    expect(href('legal.privacy', 'es')).toBe('/es/legal/privacidad');
    expect(href('listings.sold', 'es')).toBe('/es/propiedades/vendidas');
  });

  it('dynamic slug composition', () => {
    expect(href('listing.123-main-st', 'en')).toBe('/en/listings/123-main-st');
    expect(href('listing.123-main-st', 'es')).toBe('/es/propiedades/123-main-st');
    expect(href('neighborhood.brickell', 'es')).toBe('/es/vecindarios/brickell');
    // ES slug per the Phase 3 dispatch route table (was 'ganancias-netas' in P1).
    expect(href('tool.net-proceeds', 'es')).toBe('/es/herramientas/ganancia-neta');
  });

  it('the vacancy-cost tool round-trips both locales (5e route map)', () => {
    expect(href('tool.vacancy-cost', 'en')).toBe('/en/tools/vacancy-cost');
    expect(href('tool.vacancy-cost', 'es')).toBe(
      '/es/herramientas/costo-de-vacancia'
    );
  });

  it('the rental-cash-flow tool round-trips both locales (5f route map)', () => {
    // Slugs per route map row 19 (supersede the Phase 1 judgment slugs).
    expect(href('tool.rental-cashflow', 'en')).toBe('/en/tools/rental-cash-flow');
    expect(href('tool.rental-cashflow', 'es')).toBe(
      '/es/herramientas/flujo-de-caja'
    );
  });

  it('portal subpage routes (Phase 3)', () => {
    expect(href('subpage.sellers-home-valuation', 'en')).toBe(
      '/en/sellers/home-valuation'
    );
    expect(href('subpage.sellers-home-valuation', 'es')).toBe(
      '/es/vendedores/valoracion-de-vivienda'
    );
    expect(href('subpage.sellers-selling-process', 'en')).toBe(
      '/en/sellers/selling-process'
    );
    expect(href('subpage.sellers-selling-process', 'es')).toBe(
      '/es/vendedores/proceso-de-venta'
    );
    expect(() => href('subpage.unknown', 'en')).toThrow();
  });

  it('the three remaining portal subpages round-trip both locales (5d route map)', () => {
    expect(href('subpage.buyers-first-time-buyer-programs', 'en')).toBe(
      '/en/buyers/first-time-buyer-programs'
    );
    expect(href('subpage.buyers-first-time-buyer-programs', 'es')).toBe(
      '/es/compradores/programas-para-compradores-primerizos'
    );
    expect(href('subpage.investors-1031-exchange', 'en')).toBe(
      '/en/investors/1031-exchange'
    );
    expect(href('subpage.investors-1031-exchange', 'es')).toBe(
      '/es/inversionistas/intercambio-1031'
    );
    expect(href('subpage.landlords-property-management', 'en')).toBe(
      '/en/landlords/property-management'
    );
    expect(href('subpage.landlords-property-management', 'es')).toBe(
      '/es/propietarios/administracion-de-propiedades'
    );
  });
});
