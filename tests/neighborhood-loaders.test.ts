import { afterEach, describe, expect, it } from 'vitest';
import { FIXTURE_PALMS_NEIGHBORHOOD } from '@/content/neighborhoods/fixture-palms';
import { PLACEHOLDER_GROVE_STUB_NEIGHBORHOOD } from '@/content/neighborhoods/placeholder-grove-stub';
import {
  isDiscoverable,
  neighborhoodLabel,
  publishedNeighborhoods,
} from '@/lib/content/loaders';
import type { NeighborhoodStatKey, SourcedStat } from '@/lib/types';

/**
 * Dispatch 7a — the R-01 elasticity valve and the Part 1.4 key enforcement.
 *
 * THE STUB GATE: publishedNeighborhoods() is the single source for the [sub]
 * router's resolve, generateStaticParams, the sitemap, the index, and the
 * marker walker — a stub absent HERE does not exist as a route anywhere
 * (dynamicParams=false 404s it at the routing layer; e2e proves the 404).
 */

describe('the stub publish gate (R-01)', () => {
  afterEach(() => {
    delete process.env.CONTENT_STRICT;
  });

  it('the published fixture publishes; the stub does not exist', () => {
    const ids = publishedNeighborhoods().map((n) => n.id);
    expect(ids).toEqual(['fixture-palms']);
    expect(ids).not.toContain('placeholder-grove');
  });

  it('a stub is not a draft that renders empty — it is absent from the collection entirely', () => {
    expect(PLACEHOLDER_GROVE_STUB_NEIGHBORHOOD.status).toBe('stub');
    expect(
      publishedNeighborhoods().find((n) => n.slug === 'placeholder-grove-stub')
    ).toBeUndefined();
  });

  it('strict mode: the TK-named fixture unpublishes (the 5c title mode split)', () => {
    process.env.CONTENT_STRICT = '1';
    expect(publishedNeighborhoods()).toEqual([]);
  });

  it('both fixtures carry TK prose and the isFixture flag; discovery excludes them', () => {
    for (const n of [
      FIXTURE_PALMS_NEIGHBORHOOD,
      PLACEHOLDER_GROVE_STUB_NEIGHBORHOOD,
    ]) {
      for (const locale of ['en', 'es'] as const) {
        expect(n.name[locale]).toMatch(/^TK_/);
        expect(n.answer.question[locale]).toMatch(/^TK_/);
        expect(n.answer.answer[locale]).toMatch(/^TK_/);
        expect(n.overview[locale]).toMatch(/^TK_/);
      }
      expect(n.isFixture).toBe(true);
      expect(isDiscoverable(n)).toBe(false);
    }
  });

  it('neighborhoodLabel degrades an unfilled name to the structural slug', () => {
    expect(neighborhoodLabel(FIXTURE_PALMS_NEIGHBORHOOD)).toEqual({
      en: 'fixture-palms-example',
      es: 'fixture-palms-example',
    });
  });

  it('every fixture stat declares itself invented and carries source + asOf', () => {
    const stats = FIXTURE_PALMS_NEIGHBORHOOD.stats ?? {};
    const entries = Object.values(stats);
    expect(entries.length).toBeGreaterThanOrEqual(2);
    for (const stat of entries) {
      expect(stat.source.toLowerCase()).toContain('invented');
      expect(stat.source.toLowerCase()).toContain('not a market source');
      expect(stat.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

/**
 * Part 1.4 / Part 2.1 — unrepresentability, enforced at the TYPE level. Each
 * @ts-expect-error below only compiles BECAUSE the assignment fails: if the
 * key set ever reopened (or SourcedStat's source/asOf became optional), tsc
 * would flag the unused directive and this suite would fail typecheck.
 */
describe('forbidden stat keys and unsourced stats are unrepresentable', () => {
  const STAT: SourcedStat = {
    value: 1,
    unit: 'count',
    asOf: '2026-07-28',
    source: 'Invented fixture figure — not a market source',
  };

  it('the closed key union rejects the Part 1.4 exclusions', () => {
    // @ts-expect-error — education-quality rating is not a permitted stat key (Part 1.4, D-03)
    const schools: Partial<Record<NeighborhoodStatKey, SourcedStat>> = { schools: STAT };
    // @ts-expect-error — area composition is not a permitted stat key (Part 1.4, D-03)
    const demo: Partial<Record<NeighborhoodStatKey, SourcedStat>> = { demographics: STAT };
    // @ts-expect-error — attractiveness scoring is not a permitted stat key (Part 1.4, D-03)
    const scoring: Partial<Record<NeighborhoodStatKey, SourcedStat>> = { desirability: STAT };
    expect([schools, demo, scoring].length).toBe(3);
  });

  it('an unsourced or undated statistic cannot be expressed (Part 2.1)', () => {
    // @ts-expect-error — source is REQUIRED on SourcedStat
    const unsourced: SourcedStat = { value: 1, unit: 'count', asOf: '2026-07-28' };
    // @ts-expect-error — asOf is REQUIRED on SourcedStat
    const undated: SourcedStat = { value: 1, unit: 'count', source: 'x' };
    expect([unsourced, undated].length).toBe(2);
  });
});
