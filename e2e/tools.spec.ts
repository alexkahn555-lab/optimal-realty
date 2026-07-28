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
