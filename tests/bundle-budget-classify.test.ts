import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs script, no type declarations; the import is the test.
import { CEILINGS, classify } from '../scripts/bundle-budget.mjs';

/**
 * The gate's route classifier must recognize the dynamic route classes the app
 * actually builds ([locale], [locale]/[section], [locale]/[section]/[sub]) and
 * map each concrete URL to its Part 8.2 budget class. Section slugs mirror
 * lib/seo/href.ts SECTION_SEG (tools/herramientas, listings/propiedades).
 */
describe('bundle-budget classify()', () => {
  it('keeps the exact Part 8.2 ceilings (Turbopack-recalibrated 2026-07-26)', () => {
    // Derivations live on the CEILINGS table in scripts/bundle-budget.mjs:
    // measured Turbopack floor + islands-where-present + ~12–15 KB headroom.
    expect(CEILINGS).toEqual({
      base: 155,
      content: 162,
      calculator: 167,
      listingReport: 174,
    });
  });

  it('maps the home router to the framework-base class', () => {
    expect(classify('/en', '/[locale]')).toBe('base');
    expect(classify('/es', '/[locale]')).toBe('base');
  });

  it('maps section hubs to content — including the tools hub', () => {
    expect(classify('/en/contact', '/[locale]/[section]')).toBe('content');
    expect(classify('/es/contacto', '/[locale]/[section]')).toBe('content');
    expect(classify('/en/about', '/[locale]/[section]')).toBe('content');
    expect(classify('/en/sellers', '/[locale]/[section]')).toBe('content');
    expect(classify('/en/tools', '/[locale]/[section]')).toBe('content');
    expect(classify('/es/herramientas', '/[locale]/[section]')).toBe('content');
  });

  it('maps tool subpages to calculator in both locales', () => {
    expect(classify('/en/tools/net-proceeds', '/[locale]/[section]/[sub]')).toBe(
      'calculator'
    );
    expect(
      classify('/es/herramientas/ganancia-neta', '/[locale]/[section]/[sub]')
    ).toBe('calculator');
  });

  it('maps content subpages (sellers, legal) to content', () => {
    expect(
      classify('/en/sellers/home-valuation', '/[locale]/[section]/[sub]')
    ).toBe('content');
    expect(
      classify('/es/vendedores/proceso-de-venta', '/[locale]/[section]/[sub]')
    ).toBe('content');
    expect(classify('/en/legal/privacy', '/[locale]/[section]/[sub]')).toBe(
      'content'
    );
  });

  it('maps listing subpages to listingReport in both locales (Phase 4 inherits)', () => {
    expect(
      classify('/en/listings/123-example-dr', '/[locale]/[section]/[sub]')
    ).toBe('listingReport');
    expect(
      classify('/es/propiedades/123-example-dr', '/[locale]/[section]/[sub]')
    ).toBe('listingReport');
  });

  it('weighs the Phase 4a fixture reports as listingReport, the index as content', () => {
    for (const slug of [
      '100-fixture-boulevard-coral-gables',
      'fixture-condo-miami-33131',
    ]) {
      expect(classify(`/en/listings/${slug}`, '/[locale]/[section]/[sub]')).toBe(
        'listingReport'
      );
      expect(
        classify(`/es/propiedades/${slug}`, '/[locale]/[section]/[sub]')
      ).toBe('listingReport');
    }
    expect(classify('/en/listings', '/[locale]/[section]')).toBe('content');
    expect(classify('/es/propiedades', '/[locale]/[section]')).toBe('content');
  });

  it('skips framework error shells (no Part 8 class)', () => {
    expect(classify('/_not-found', '/_not-found')).toBeNull();
    expect(classify('/_global-error', '/_global-error')).toBeNull();
  });
});
