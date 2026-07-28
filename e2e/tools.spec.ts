import { expect, test } from '@playwright/test';
import { UI } from '../content/ui-strings';

/**
 * Dispatch 5e e2e — the vacancy-cost calculator on the shared CalcShell in
 * both locales. Every prose field is an unfilled placeholder marker: the page
 * serves visible placeholders (H1, answer, method note, disclaimer) with zero
 * raw TK_ strings; the island computes the golden-table cents live; the
 * days-valued trade-off line renders as DAYS, never dollars; result state
 * serializes to the querystring while the canonical stays bare; and the tool
 * is listed on the tools hub, the landlords rack, and both discovery
 * surfaces. Live providers are never touched from CI.
 */

const SITE_NAME = 'Optimal Realty';
const EN_URL = '/en/tools/vacancy-cost';
const ES_URL = '/es/herramientas/costo-de-vacancia';

for (const { locale, path } of [
  { locale: 'en' as const, path: EN_URL },
  { locale: 'es' as const, path: ES_URL },
]) {
  test(`vacancy ${locale}: visible placeholders (H1, answer, method, disclaimer), zero raw TK_`, async ({
    page,
  }) => {
    await page.goto(path);
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: '⟨ TK · TOOL_VACANCY_COST_QUESTION ⟩',
      })
    ).toBeVisible();
    await expect(
      page.getByText('⟨ TK · TOOL_VACANCY_COST_ANSWER ⟩')
    ).toBeVisible();
    await expect(
      page.getByText('⟨ TK · TOOL_VACANCY_COST_METHOD ⟩')
    ).toBeVisible();
    await expect(
      page.getByText('⟨ TK · TOOL_VACANCY_COST_DISCLAIMER ⟩')
    ).toBeVisible();
    expect(await page.title()).toBe(SITE_NAME);
    const html = await page.content();
    expect(/\bTK_/.test(html), `${path} served a raw TK_ marker`).toBe(false);
  });
}

test('golden parity in the DOM: $2,000 rent × 7 vacant days = $460.27', async ({
  page,
}) => {
  await page.goto(EN_URL);
  await page.locator('#calc-monthlyRent').fill('2000');
  await page.locator('#calc-vacantDays').fill('7');

  const headline = page.getByTestId('calc-headline');
  await expect(headline).toBeVisible();
  await expect(headline).toHaveText('$460.27');
  // The output is labeled an estimate.
  await expect(page.getByText(UI.calc.estimateTag.en).first()).toBeVisible();
  // The headline label follows the vacancy headline key.
  await expect(page.getByText(UI.ledger.vacancyTotal.en)).toBeVisible();
});

test('the days trade-off line renders as DAYS, never dollars', async ({ page }) => {
  await page.goto(EN_URL);
  await page.locator('#calc-monthlyRent').fill('2000');
  await page.locator('#calc-vacantDays').fill('30');
  await page.locator('#calc-proposedRentIncrease').fill('50');

  // leaseMonths defaults to 12 (flagged assumption) → 9.13 days (golden 6).
  await expect(page.getByText(UI.ledger.maxExtraVacantDays.en)).toBeVisible();
  await expect(page.getByText('9.13 days')).toBeVisible();
  const panel = await page.getByTestId('calc-headline').locator('..').textContent();
  expect(panel).not.toContain('$9.13');
});

test('result state serializes to the querystring; canonical stays bare', async ({
  page,
}) => {
  await page.goto(EN_URL);
  await page.locator('#calc-monthlyRent').fill('2000');
  await page.locator('#calc-vacantDays').fill('7');
  await expect(page).toHaveURL(/monthlyRent=2000/);
  await expect(page).toHaveURL(/vacantDays=7/);
  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveAttribute('href', /\/en\/tools\/vacancy-cost$/);
});

test('the assumptions table surfaces the flagged lease-term default', async ({
  page,
}) => {
  await page.goto(EN_URL);
  await expect(page.getByText('leaseMonthsDefault')).toBeVisible();
  await expect(
    page.getByText(UI.calc.basisUnconfirmedDefault.en).first()
  ).toBeVisible();
});

test('"email me this breakdown" posts tool attribution and the days line', async ({
  page,
}) => {
  let submission: Record<string, unknown> | null = null;
  await page.route('**/api/leads', async (route) => {
    submission = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'e2e-mock-id' }),
    });
  });

  await page.goto(EN_URL);
  await page.locator('#calc-monthlyRent').fill('2000');
  await page.locator('#calc-vacantDays').fill('7');
  await expect(page.getByTestId('calc-headline')).toBeVisible();

  await page.getByText(UI.calc.emailBreakdown.en).click();
  await page.locator('#lead-full-name').fill('Test Landlord');
  await page.locator('#lead-email').fill('landlord@example.com');
  await page.getByRole('button', { name: UI.form.submit.en }).click();
  await expect(page.getByText(UI.form.successHeading.en)).toBeVisible();

  expect(submission).not.toBeNull();
  const body = submission as unknown as Record<string, unknown>;
  expect(body.sourceType).toBe('tool');
  expect(body.sourceSlug).toBe('vacancy-cost');
  expect(body.intent).toBe('lease-out');
  expect(String(body.route)).toBe(EN_URL);

  const payload = body.payload as {
    outputs: {
      headline: { key: string; amountCents: number };
      secondaryLines?: { key: string; amountCents: number; basis: string }[];
    };
  };
  expect(payload.outputs.headline.key).toBe('vacancyTotal');
  expect(payload.outputs.headline.amountCents).toBe(46_027);
  expect(payload.outputs.secondaryLines?.[0]?.key).toBe('maxExtraVacantDays');
});

test('the tools hub lists the tool in both locales; the card links through', async ({
  page,
}) => {
  await page.goto('/en/tools');
  const enCard = page.locator(`a[href="${EN_URL}"]`);
  await expect(enCard).toBeVisible();
  expect(/\bTK_/.test(await page.content())).toBe(false);

  await page.goto('/es/herramientas');
  await expect(page.locator(`a[href="${ES_URL}"]`)).toBeVisible();
  expect(/\bTK_/.test(await page.content())).toBe(false);

  await page.goto('/en/tools');
  await enCard.click();
  await expect(page).toHaveURL(EN_URL);
});

test('the landlords rack renders the tool in both locales', async ({ page }) => {
  await page.goto('/en/landlords');
  await expect(page.locator(`a[href="${EN_URL}"]`)).toBeVisible();
  expect(/\bTK_/.test(await page.content())).toBe(false);

  await page.goto('/es/propietarios');
  await expect(page.locator(`a[href="${ES_URL}"]`)).toBeVisible();
  expect(/\bTK_/.test(await page.content())).toBe(false);
});

test('both tool URLs sit on both discovery surfaces — marker-free', async ({
  page,
}) => {
  const sitemap = await (await page.request.get('/sitemap.xml')).text();
  const llms = await (await page.request.get('/llms.txt')).text();
  for (const url of [EN_URL, ES_URL]) {
    expect(sitemap, `sitemap.xml must carry ${url}`).toContain(url);
    expect(llms, `llms.txt must carry ${url}`).toContain(url);
  }
  expect(/\bTK_/.test(sitemap)).toBe(false);
  expect(/\bTK_/.test(llms)).toBe(false);
});

test('cross-locale tool segments 404', async ({ page }) => {
  for (const path of ['/en/tools/costo-de-vacancia', '/es/herramientas/vacancy-cost']) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(404);
  }
});

/* ==========================================================================
 * Dispatch 5f — the rental cash flow calculator: first engine with BOTH
 * ledgers populated. The monthly and one-time blocks render as distinct
 * groups with no combined total; ratios render as percentages / a plain
 * ratio; dscr disappears on an all-cash purchase.
 * ========================================================================== */

const RENTAL_EN = '/en/tools/rental-cash-flow';
const RENTAL_ES = '/es/herramientas/flujo-de-caja';

/** Baseline golden inputs (defaults untouched: 6.5% · 5% · 8% · 10%). */
async function fillRentalBaseline(page: import('@playwright/test').Page) {
  await page.locator('#calc-purchasePrice').fill('300000');
  await page.locator('#calc-monthlyRent').fill('3000');
  await page.locator('#calc-downPaymentPct').fill('20');
  await page.locator('#calc-loanTermYears').fill('30');
  await page.locator('#calc-annualTaxes').fill('4800');
  await page.locator('#calc-annualInsurance').fill('2400');
  await page.locator('#calc-closingCosts').fill('6000');
}

for (const { locale, path } of [
  { locale: 'en' as const, path: RENTAL_EN },
  { locale: 'es' as const, path: RENTAL_ES },
]) {
  test(`rental ${locale}: visible placeholders (H1, answer, method, disclaimer), zero raw TK_`, async ({
    page,
  }) => {
    await page.goto(path);
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: '⟨ TK · TOOL_RENTAL_CASHFLOW_QUESTION ⟩',
      })
    ).toBeVisible();
    await expect(
      page.getByText('⟨ TK · TOOL_RENTAL_CASHFLOW_ANSWER ⟩')
    ).toBeVisible();
    await expect(
      page.getByText('⟨ TK · TOOL_RENTAL_CASHFLOW_METHOD ⟩')
    ).toBeVisible();
    await expect(
      page.getByText('⟨ TK · TOOL_RENTAL_CASHFLOW_DISCLAIMER ⟩')
    ).toBeVisible();
    expect(await page.title()).toBe(SITE_NAME);
    const html = await page.content();
    expect(/\bTK_/.test(html), `${path} served a raw TK_ marker`).toBe(false);
  });
}

test('rental golden parity in the DOM: baseline → $2,316.48 annual cash flow', async ({
  page,
}) => {
  await page.goto(RENTAL_EN);
  await fillRentalBaseline(page);

  const headline = page.getByTestId('calc-headline');
  await expect(headline).toBeVisible();
  await expect(headline).toHaveText('$2,316.48');
  await expect(page.getByText(UI.ledger.annualCashFlow.en)).toBeVisible();
  await expect(page.getByText(UI.calc.estimateTag.en).first()).toBeVisible();

  // The two blocks are visually distinct groups with their own headings.
  await expect(page.getByText(UI.calc.monthlyHeading.en, { exact: true })).toBeVisible();
  await expect(page.getByText(UI.calc.oneTimeHeading.en, { exact: true })).toBeVisible();
  await expect(page.getByText('$1,516.96')).toBeVisible(); // debt service (monthly)
  await expect(page.getByText('$60,000.00')).toBeVisible(); // down payment (one-time)

  // Ratios render as ratios: cap 6.84%, CoC 3.51%, DSCR 1.13 — never USD.
  await expect(page.getByText('6.84%')).toBeVisible();
  await expect(page.getByText('3.51%')).toBeVisible();
  await expect(page.getByText('1.13', { exact: true })).toBeVisible();
  const panelText = await page.getByTestId('calc-headline').locator('..').textContent();
  expect(panelText).not.toContain('$6.84');
  expect(panelText).not.toContain('$70,516.96'); // no cross-array total
});

test('rental all-cash: dscr line disappears rather than reading infinite', async ({
  page,
}) => {
  await page.goto(RENTAL_EN);
  await fillRentalBaseline(page);
  await page.locator('#calc-downPaymentPct').fill('100');
  await expect(page.getByTestId('calc-headline')).toBeVisible();
  await expect(page.getByText(UI.ledger.dscr.en)).toHaveCount(0);
  await expect(page.getByText(UI.ledger.debtService.en)).toHaveCount(0);
});

test('rental result state serializes; canonical stays bare', async ({ page }) => {
  await page.goto(RENTAL_EN);
  await fillRentalBaseline(page);
  await expect(page).toHaveURL(/purchasePrice=300000/);
  await expect(page).toHaveURL(/monthlyRent=3000/);
  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveAttribute('href', /\/en\/tools\/rental-cash-flow$/);
});

test('rental assumptions table: three flagged defaults + the market rate with ITS date', async ({
  page,
}) => {
  await page.goto(RENTAL_EN);
  for (const key of [
    'vacancyRatePct',
    'maintenancePct',
    'managementPct',
    'mortgageRatePct',
  ]) {
    await expect(page.getByText(key)).toBeVisible();
  }
  await expect(
    page.getByText(UI.calc.basisUnconfirmedDefault.en).first()
  ).toBeVisible();
  await expect(
    page.getByText(UI.calc.basisMarketMustUpdate.en).first()
  ).toBeVisible();
  await expect(page.getByText('Jul 28, 2026').first()).toBeVisible();
  await expect(page.getByText('Jul 19, 2026').first()).toBeVisible();
});

test('rental "email me this breakdown" posts invest attribution with both ledgers', async ({
  page,
}) => {
  let submission: Record<string, unknown> | null = null;
  await page.route('**/api/leads', async (route) => {
    submission = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'e2e-mock-id' }),
    });
  });

  await page.goto(RENTAL_EN);
  await fillRentalBaseline(page);
  await expect(page.getByTestId('calc-headline')).toBeVisible();

  await page.getByText(UI.calc.emailBreakdown.en).click();
  await page.locator('#lead-full-name').fill('Test Investor');
  await page.locator('#lead-email').fill('investor@example.com');
  await page.getByRole('button', { name: UI.form.submit.en }).click();
  await expect(page.getByText(UI.form.successHeading.en)).toBeVisible();

  expect(submission).not.toBeNull();
  const body = submission as unknown as Record<string, unknown>;
  expect(body.sourceType).toBe('tool');
  expect(body.sourceSlug).toBe('rental-cashflow');
  expect(body.intent).toBe('invest');
  expect(String(body.route)).toBe(RENTAL_EN);

  const payload = body.payload as {
    outputs: {
      headline: { key: string; amountCents: number };
      monthlyLines: { key: string }[];
      oneTimeLines: { key: string }[];
    };
  };
  expect(payload.outputs.headline.key).toBe('annualCashFlow');
  expect(payload.outputs.headline.amountCents).toBe(231_648);
  expect(payload.outputs.monthlyLines.map((l) => l.key)).toContain('debtService');
  expect(payload.outputs.oneTimeLines.map((l) => l.key)).toContain('downPayment');
});

test('rental listed on the tools hub and the investors rack, both locales', async ({
  page,
}) => {
  await page.goto('/en/tools');
  await expect(page.locator(`a[href="${RENTAL_EN}"]`)).toBeVisible();
  await page.goto('/es/herramientas');
  await expect(page.locator(`a[href="${RENTAL_ES}"]`)).toBeVisible();
  await page.goto('/en/investors');
  await expect(page.locator(`a[href="${RENTAL_EN}"]`)).toBeVisible();
  expect(/\bTK_/.test(await page.content())).toBe(false);
  await page.goto('/es/inversionistas');
  await expect(page.locator(`a[href="${RENTAL_ES}"]`)).toBeVisible();
  expect(/\bTK_/.test(await page.content())).toBe(false);
});

test('rental URLs sit on both discovery surfaces — marker-free', async ({
  page,
}) => {
  const sitemap = await (await page.request.get('/sitemap.xml')).text();
  const llms = await (await page.request.get('/llms.txt')).text();
  for (const url of [RENTAL_EN, RENTAL_ES]) {
    expect(sitemap, `sitemap.xml must carry ${url}`).toContain(url);
    expect(llms, `llms.txt must carry ${url}`).toContain(url);
  }
});

test('cross-locale rental segments 404', async ({ page }) => {
  for (const path of ['/en/tools/flujo-de-caja', '/es/herramientas/rental-cash-flow']) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(404);
  }
});

/* ==========================================================================
 * Dispatch 5g — the condo assessment exposure calculator: disclosure
 * arithmetic only. No assumptions table renders (there are none), nothing is
 * prefilled, the headline switches from funding gap to assessment total when
 * an assessment is levied, and a negative gap reads plainly.
 * ========================================================================== */

const CONDO_EN = '/en/tools/condo-assessment-exposure';
const CONDO_ES = '/es/herramientas/exposicion-a-cuotas-especiales';

async function fillCondoBaseline(page: import('@playwright/test').Page) {
  await page.locator('#calc-unitSharePct').fill('1');
  await page.locator('#calc-reserveBalance').fill('500000');
  await page.locator('#calc-deferredItemsTotal').fill('900000');
  await page.locator('#calc-monthlyDues').fill('850');
}

for (const { locale, path } of [
  { locale: 'en' as const, path: CONDO_EN },
  { locale: 'es' as const, path: CONDO_ES },
]) {
  test(`condo ${locale}: visible placeholders (H1, answer, method, disclaimer), zero raw TK_`, async ({
    page,
  }) => {
    await page.goto(path);
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: '⟨ TK · TOOL_CONDO_ASSESSMENT_QUESTION ⟩',
      })
    ).toBeVisible();
    await expect(
      page.getByText('⟨ TK · TOOL_CONDO_ASSESSMENT_ANSWER ⟩')
    ).toBeVisible();
    await expect(
      page.getByText('⟨ TK · TOOL_CONDO_ASSESSMENT_METHOD ⟩')
    ).toBeVisible();
    await expect(
      page.getByText('⟨ TK · TOOL_CONDO_ASSESSMENT_DISCLAIMER ⟩')
    ).toBeVisible();
    expect(await page.title()).toBe(SITE_NAME);
    const html = await page.content();
    expect(/\bTK_/.test(html), `${path} served a raw TK_ marker`).toBe(false);
  });
}

test('condo: NO assumptions section renders and no field is prefilled', async ({
  page,
}) => {
  await page.goto(CONDO_EN);
  await expect(page.getByText(UI.calc.assumptionsHeading.en)).toHaveCount(0);
  // Every input starts EMPTY — no association figure is ever prefilled.
  for (const key of [
    'unitSharePct',
    'reserveBalance',
    'deferredItemsTotal',
    'assessmentTotal',
    'assessmentTermMonths',
    'assessmentInterestPct',
    'monthlyDues',
  ]) {
    await expect(page.locator(`#calc-${key}`)).toHaveValue('');
  }
});

test('condo golden parity in the DOM: gap headline, then assessment headline', async ({
  page,
}) => {
  await page.goto(CONDO_EN);
  await fillCondoBaseline(page);

  // No assessment → headline is the unit's funding gap: 1% of 900k − 500k.
  const headline = page.getByTestId('calc-headline');
  await expect(headline).toBeVisible();
  await expect(headline).toHaveText('$4,000.00');
  await expect(page.getByText(UI.ledger.fundingGap.en).first()).toBeVisible();
  await expect(page.getByText(UI.calc.estimateTag.en).first()).toBeVisible();

  // Levy an assessment → the headline switches to the unit assessment total
  // (golden case 4: $12,000 share over 24 months at 6% → $12,764.34).
  await page.locator('#calc-assessmentTotal').fill('1200000');
  await page.locator('#calc-assessmentTermMonths').fill('24');
  await page.locator('#calc-assessmentInterestPct').fill('6');
  await expect(headline).toHaveText('$12,764.34');
  await expect(page.getByText(UI.ledger.assessmentTotal.en).first()).toBeVisible();
  await expect(page.getByText('$531.85')).toBeVisible(); // installment (monthly)
  await expect(page.getByText(UI.calc.monthlyHeading.en, { exact: true })).toBeVisible();
  await expect(page.getByText(UI.calc.oneTimeHeading.en, { exact: true })).toBeVisible();
});

test('condo: reserves exceeding deferred items read as a plain negative gap', async ({
  page,
}) => {
  await page.goto(CONDO_EN);
  await page.locator('#calc-unitSharePct').fill('1.25');
  await page.locator('#calc-reserveBalance').fill('2000000');
  await page.locator('#calc-deferredItemsTotal').fill('1500000');
  await page.locator('#calc-monthlyDues').fill('850');
  await expect(page.getByTestId('calc-headline')).toHaveText('-$6,250.00');
  await expect(page.getByText(UI.ledger.fundingGap.en).first()).toBeVisible();
});

test('condo result state serializes; canonical stays bare', async ({ page }) => {
  await page.goto(CONDO_EN);
  await fillCondoBaseline(page);
  await expect(page).toHaveURL(/unitSharePct=1/);
  await expect(page).toHaveURL(/reserveBalance=500000/);
  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveAttribute(
    'href',
    /\/en\/tools\/condo-assessment-exposure$/
  );
});

test('condo "email me this breakdown" posts buy attribution', async ({ page }) => {
  let submission: Record<string, unknown> | null = null;
  await page.route('**/api/leads', async (route) => {
    submission = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'e2e-mock-id' }),
    });
  });

  await page.goto(CONDO_EN);
  await fillCondoBaseline(page);
  await expect(page.getByTestId('calc-headline')).toBeVisible();

  await page.getByText(UI.calc.emailBreakdown.en).click();
  await page.locator('#lead-full-name').fill('Test Buyer');
  await page.locator('#lead-email').fill('buyer@example.com');
  await page.getByRole('button', { name: UI.form.submit.en }).click();
  await expect(page.getByText(UI.form.successHeading.en)).toBeVisible();

  expect(submission).not.toBeNull();
  const body = submission as unknown as Record<string, unknown>;
  expect(body.sourceType).toBe('tool');
  expect(body.sourceSlug).toBe('condo-assessment');
  expect(body.intent).toBe('buy');
  expect(String(body.route)).toBe(CONDO_EN);

  const payload = body.payload as {
    outputs: { headline: { key: string; amountCents: number } };
  };
  expect(payload.outputs.headline.key).toBe('fundingGap');
  expect(payload.outputs.headline.amountCents).toBe(400_000);
});

test('condo listed on the tools hub and BOTH racks, both locales', async ({
  page,
}) => {
  await page.goto('/en/tools');
  await expect(page.locator(`a[href="${CONDO_EN}"]`)).toBeVisible();
  await page.goto('/es/herramientas');
  await expect(page.locator(`a[href="${CONDO_ES}"]`)).toBeVisible();
  for (const hub of ['/en/buyers', '/en/investors']) {
    await page.goto(hub);
    await expect(page.locator(`a[href="${CONDO_EN}"]`)).toBeVisible();
    expect(/\bTK_/.test(await page.content()), hub).toBe(false);
  }
  for (const hub of ['/es/compradores', '/es/inversionistas']) {
    await page.goto(hub);
    await expect(page.locator(`a[href="${CONDO_ES}"]`)).toBeVisible();
    expect(/\bTK_/.test(await page.content()), hub).toBe(false);
  }
});

test('condo URLs sit on both discovery surfaces — marker-free', async ({
  page,
}) => {
  const sitemap = await (await page.request.get('/sitemap.xml')).text();
  const llms = await (await page.request.get('/llms.txt')).text();
  for (const url of [CONDO_EN, CONDO_ES]) {
    expect(sitemap, `sitemap.xml must carry ${url}`).toContain(url);
    expect(llms, `llms.txt must carry ${url}`).toContain(url);
  }
});

test('cross-locale condo segments 404', async ({ page }) => {
  for (const path of [
    '/en/tools/exposicion-a-cuotas-especiales',
    '/es/herramientas/condo-assessment-exposure',
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(404);
  }
});
