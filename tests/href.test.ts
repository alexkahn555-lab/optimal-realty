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

  it('legal + sold children', () => {
    expect(href('legal.privacy', 'es')).toBe('/es/legal/privacidad');
    expect(href('listings.sold', 'es')).toBe('/es/propiedades/vendidas');
  });

  it('dynamic slug composition', () => {
    expect(href('listing.123-main-st', 'en')).toBe('/en/listings/123-main-st');
    expect(href('listing.123-main-st', 'es')).toBe('/es/propiedades/123-main-st');
    expect(href('neighborhood.brickell', 'es')).toBe('/es/vecindarios/brickell');
    expect(href('tool.net-proceeds', 'es')).toBe('/es/herramientas/ganancias-netas');
  });
});
