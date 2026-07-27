import { describe, expect, it } from 'vitest';
import {
  ZERO_JS_TOLERANCE_BYTES,
  ZERO_JS_URLS,
  zeroJsBreaches,
  // @ts-expect-error — plain .mjs script, no type declarations; the import is the test.
} from '../scripts/bundle-budget.mjs';

/**
 * Dispatch 5a — the zero-JS assertion: content routes that Part 8.2 budgets
 * at ZERO route-specific JS are pinned to the run-derived framework floor,
 * because the per-class KB ceilings alone would let an island land silently
 * inside their headroom. The floor is derived (min weighed first-load), the
 * tolerance covers only shared lazy-boundary stubs, and a listed route that
 * vanishes from the weigh-in is a FAILURE, not a silent un-assertion.
 */

const KB = 1024;

/** Minimal weighed-row helper. */
function row(url: string, bytes: number): { url: string; bytes: number } {
  return { url, bytes };
}

describe('ZERO_JS route list', () => {
  it('covers about, the tools hub, and all legal routes in both locales', () => {
    expect([...ZERO_JS_URLS].sort()).toEqual(
      [
        '/en/about',
        '/es/nosotros',
        '/en/tools',
        '/es/herramientas',
        '/en/legal/privacy',
        '/en/legal/terms',
        '/en/legal/disclosures',
        '/en/legal/accessibility',
        '/es/legal/privacidad',
        '/es/legal/terminos',
        '/es/legal/divulgaciones',
        '/es/legal/accesibilidad',
      ].sort()
    );
  });

  it('pins the tolerance at 0.5 KB — below every real island', () => {
    // The smallest island in the codebase is the lightbox shell at 1,090 B
    // gzipped (tests/island-budget-4b.test.ts prints the measurement);
    // LeadForm is ~6 KB, CalcIsland ~10.6 KB. 512 B admits boundary stubs
    // (measured +0.1 KB on legal) and nothing that executes UI.
    expect(ZERO_JS_TOLERANCE_BYTES).toBe(512);
  });
});

describe('zeroJsBreaches()', () => {
  const FLOOR = 140 * KB;

  it('derives the floor as the minimum weighed first-load across ALL routes', () => {
    const { floor } = zeroJsBreaches([
      row('/en/tools', FLOOR + 100),
      row('/en', FLOOR), // a non-asserted route may set the floor
      row('/en/contact', FLOOR + 6 * KB),
    ]);
    expect(floor).toBe(FLOOR);
  });

  it('passes a zero-JS route inside the tolerance (the stub allowance)', () => {
    const { breaches } = zeroJsBreaches([
      row('/en/about', FLOOR),
      row('/en/legal/privacy', FLOOR + 102), // today's measured +0.1 KB
      row('/en/legal/terms', FLOOR + ZERO_JS_TOLERANCE_BYTES), // boundary: ≤ passes
    ]);
    expect(breaches).toEqual([]);
  });

  it('fails a zero-JS route one byte past the tolerance', () => {
    const { breaches } = zeroJsBreaches([
      row('/en/about', FLOOR),
      row('/en/legal/privacy', FLOOR + ZERO_JS_TOLERANCE_BYTES + 1),
    ]);
    expect(breaches.map((r: { url: string }) => r.url)).toEqual([
      '/en/legal/privacy',
    ]);
  });

  it('fails a zero-JS route that acquires the smallest real island', () => {
    // Lightbox shell = 1,090 B gz — the smallest island cannot hide.
    const { breaches } = zeroJsBreaches([
      row('/en', FLOOR),
      row('/en/tools', FLOOR + 1_090),
    ]);
    expect(breaches).toHaveLength(1);
  });

  it('never flags routes outside the ZERO_JS list, however heavy', () => {
    const { breaches } = zeroJsBreaches([
      row('/en/about', FLOOR),
      row('/en/tools/net-proceeds', FLOOR + 12 * KB), // calculator — islands by design
    ]);
    expect(breaches).toEqual([]);
  });

  it('reports listed routes missing from the weighed set (rename ≠ un-assert)', () => {
    const weighed = [...ZERO_JS_URLS]
      .filter((url) => url !== '/es/legal/terminos')
      .map((url) => row(url, FLOOR));
    const { missing } = zeroJsBreaches(weighed);
    expect(missing).toEqual(['/es/legal/terminos']);

    const complete = zeroJsBreaches([...ZERO_JS_URLS].map((url) => row(url, FLOOR)));
    expect(complete.missing).toEqual([]);
  });
});
