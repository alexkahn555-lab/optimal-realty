import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { UI } from '@/content/ui-strings';
import { LISTING_L_2026_001 } from '@/content/listings/l-2026-001';
import { LISTING_L_2026_002 } from '@/content/listings/l-2026-002';
import type { Listing } from '@/lib/types';
import { formatCents } from '@/components/calc/labels';
import {
  buildListingCosts,
  CostBreakdown,
} from '@/components/listing/CostBreakdown';
import { DisclosureBlock } from '@/components/listing/DisclosureBlock';
import { FactsTable } from '@/components/listing/FactsTable';
import { ListingAnswer } from '@/components/listing/ListingAnswer';
import { MediaGallery } from '@/components/listing/MediaGallery';

/**
 * D4 module contract: (listing, locale) => Section | null — absent data
 * renders NULL (degrade by omission, no placeholder text), and M6 upholds the
 * no-cross-sum rule: monthly and one-time are separate blocks whose combined
 * total appears nowhere.
 */

function variant(base: Listing, patch: Partial<Listing>): Listing {
  return { ...base, ...patch };
}

describe('modules render null cleanly on absent data', () => {
  it('ListingAnswer: TK or empty summary → null', () => {
    expect(
      renderToStaticMarkup(
        <ListingAnswer
          listing={variant(LISTING_L_2026_001, {
            summary: { en: 'TK_SUMMARY', es: 'TK_SUMMARY' },
          })}
          locale="en"
        />
      )
    ).toBe('');
    expect(
      renderToStaticMarkup(
        <ListingAnswer
          listing={variant(LISTING_L_2026_001, { summary: { en: ' ', es: ' ' } })}
          locale="en"
        />
      )
    ).toBe('');
  });

  it('MediaGallery: no media → null', () => {
    expect(
      renderToStaticMarkup(
        <MediaGallery
          listing={variant(LISTING_L_2026_001, { media: [] })}
          locale="en"
        />
      )
    ).toBe('');
  });

  it('CostBreakdown: lease offers have no net-proceeds ledger → null', () => {
    expect(
      renderToStaticMarkup(
        <CostBreakdown
          listing={variant(LISTING_L_2026_001, { offerType: 'lease' })}
          locale="en"
        />
      )
    ).toBe('');
  });

  it('CostBreakdown: no HOA/taxes → the monthly block is omitted entirely', () => {
    const markup = renderToStaticMarkup(
      <CostBreakdown listing={LISTING_L_2026_001} locale="en" />
    );
    // Fixture 1 has taxes (monthly renders); strip both and the block goes.
    const bare = renderToStaticMarkup(
      <CostBreakdown
        listing={variant(LISTING_L_2026_001, {
          facts: { ...LISTING_L_2026_001.facts, taxesAnnual: undefined },
        })}
        locale="en"
      />
    );
    expect(markup).toContain(UI.calc.monthlyHeading.en);
    expect(bare).not.toContain(UI.calc.monthlyHeading.en);
    expect(bare).toContain(UI.calc.oneTimeHeading.en);
  });

  it('FactsTable renders only present keys', () => {
    const markup = renderToStaticMarkup(
      <FactsTable listing={LISTING_L_2026_001} locale="en" />
    );
    expect(markup).toContain('Pool'); // present boolean
    expect(markup).not.toContain('Waterfront'); // absent boolean
    expect(markup).toContain('Lot area');
    const condo = renderToStaticMarkup(
      <FactsTable listing={LISTING_L_2026_002} locale="en" />
    );
    expect(condo).not.toContain('Lot area'); // condo has no lot
    expect(condo).not.toContain('Half baths'); // bathsHalf 0
  });

  it('DisclosureBlock shows the license line; the TK notice never renders raw', () => {
    const markup = renderToStaticMarkup(<DisclosureBlock locale="en" />);
    expect(markup).toContain('BK3446865');
    expect(markup).toContain('RD8416');
    expect(markup).toContain('CAM64581');
    expect(markup).not.toContain('TK_'); // placeholder marker text, not the marker
  });
});

describe('M6 — the no-cross-sum rule and the calculator deep link', () => {
  const costs = buildListingCosts(LISTING_L_2026_002);
  const markup = renderToStaticMarkup(
    <CostBreakdown listing={LISTING_L_2026_002} locale="en" />
  );

  it('monthly and one-time are separate, both non-empty for the condo fixture', () => {
    expect(costs.monthlyLines.length).toBeGreaterThan(0); // HOA + taxes/12
    expect(costs.oneTimeLines.length).toBeGreaterThan(0);
    expect(markup).toContain(UI.calc.monthlyHeading.en);
    expect(markup).toContain(UI.calc.oneTimeHeading.en);
  });

  it('the cross-array total appears nowhere', () => {
    const monthly = costs.monthlyLines.reduce((sum, l) => sum + l.amountCents, 0);
    const oneTime = costs.oneTimeLines.reduce((sum, l) => sum + l.amountCents, 0);
    expect(markup).not.toContain(formatCents(monthly + oneTime, 'en'));
    // Neither block even renders its own total — only lines.
    expect(markup).toContain(formatCents(costs.monthlyLines[0]!.amountCents, 'en'));
  });

  it('condo (class other) hits the Miami-Dade surtax branch', () => {
    expect(costs.oneTimeLines.some((l) => l.key === 'docStampSurtax')).toBe(true);
  });

  it('deep-links to net-proceeds with the listing prefilled via the codec', () => {
    // ES locale → localized tool route; only non-default values serialize.
    const es = renderToStaticMarkup(
      <CostBreakdown listing={LISTING_L_2026_002} locale="es" />
    );
    expect(es).toContain('/es/herramientas/ganancia-neta?');
    expect(es).toContain('salePrice=589000');
    expect(es).toContain('propertyClass=other');
    expect(es).toContain('annualPropertyTax=8640');
    expect(es).toContain('hoaMonthly=950');
    expect(es).not.toContain('county='); // default — never serialized

    const en = renderToStaticMarkup(
      <CostBreakdown listing={LISTING_L_2026_001} locale="en" />
    );
    expect(en).toContain('/en/tools/net-proceeds?');
    expect(en).toContain('salePrice=1285000');
    expect(en).not.toContain('propertyClass='); // single-family is the default
  });

  it('flagged (unverified-basis) lines carry the † mark', () => {
    expect(markup).toContain('†');
  });
});
