import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ResultPanel } from '@/components/calc/ResultPanel';
import type { EngineResult } from '@/lib/types';

/**
 * THE NO-CROSS-SUM RULE (Part 6.2): monthly and one-time ledgers are SEPARATE
 * arrays and no component may total across them — a one-time cost folded into
 * a recurring figure is a real error a user would act on. The fixture makes
 * the illegal cross-sum a distinctive figure and asserts it appears NOWHERE,
 * while both blocks render under their own headings.
 */

const FIXTURE: EngineResult & { grossCents?: number } = {
  monthlyLines: [
    {
      key: 'm1',
      label: { en: 'Monthly fixture line', es: 'Monthly fixture line' },
      amountCents: 11_111,
      basis: 'input',
    },
  ],
  oneTimeLines: [
    {
      key: 'o1',
      label: { en: 'One-time fixture line', es: 'One-time fixture line' },
      amountCents: 22_222,
      basis: 'input',
    },
  ],
  headline: { key: 'netProceeds', amountCents: 55_555 },
  assumptionKeysUsed: [],
};

describe('no summing across monthlyLines and oneTimeLines', () => {
  const markup = renderToStaticMarkup(
    <ResultPanel
      result={FIXTURE}
      locale="en"
      values={{}}
      sourceSlug="net-proceeds"
      leadIntent="sell"
    />
  );

  it('renders the two ledgers as separate blocks with their own headings', () => {
    expect(markup).toContain('$111.11');
    expect(markup).toContain('$222.22');
    expect(markup).toContain('$555.55');
    expect(markup).toContain('One-time costs at closing');
    expect(markup).toContain('Monthly');
  });

  it('the cross-array total appears nowhere', () => {
    // 11_111 + 22_222 = 33_333 → the forbidden figure.
    expect(markup).not.toContain('$333.33');
    // Nor a cross-sum folded into the headline: 55_555 + 11_111 etc.
    expect(markup).not.toContain('$666.66');
  });
});
