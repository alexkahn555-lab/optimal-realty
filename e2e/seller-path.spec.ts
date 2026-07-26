import { expect, test } from '@playwright/test';
import { SELLERS_PORTAL } from '../content/portals/sellers';
import { HOME_VALUATION_SUBPAGE } from '../content/subpages/home-valuation';
import { NET_PROCEEDS_TOOL } from '../content/tools/net-proceeds';
import { UI } from '../content/ui-strings';

/**
 * Seller path e2e (Phase 3 DoD): hub → subpage → calculator in both locales at
 * both viewports (screenshots committed), a client-side computation exercised
 * through the island, and the "email me this breakdown" submit against a
 * route-level mock carrying {inputs, outputs} with tool attribution. Live
 * providers are never touched from CI.
 */

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 900 },
] as const;

const PAGES = [
  {
    name: 'sellers',
    heading: SELLERS_PORTAL.answer.question,
    paths: { en: '/en/sellers', es: '/es/vendedores' },
  },
  {
    name: 'valuation',
    heading: HOME_VALUATION_SUBPAGE.answer.question,
    paths: {
      en: '/en/sellers/home-valuation',
      es: '/es/vendedores/valoracion-de-vivienda',
    },
  },
  {
    name: 'calc',
    heading: NET_PROCEEDS_TOOL.answer.question,
    paths: {
      en: '/en/tools/net-proceeds',
      es: '/es/herramientas/ganancia-neta',
    },
  },
] as const;

for (const page_ of PAGES) {
  for (const locale of ['en', 'es'] as const) {
    for (const vp of VIEWPORTS) {
      test(`${page_.name} ${locale} ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(page_.paths[locale]);
        await expect(
          page.getByRole('heading', { level: 1, name: page_.heading[locale] })
        ).toBeVisible();
        await page.screenshot({
          path: `e2e/screenshots/${page_.name}-${locale}-${vp.name}.png`,
          fullPage: true,
        });
      });
    }
  }
}

test('hub links to the calculator; assumptions table shows flagged defaults', async ({
  page,
}) => {
  await page.goto('/es/vendedores');
  await page
    .getByRole('link', { name: new RegExp(NET_PROCEEDS_TOOL.title.es) })
    .click();
  await expect(page).toHaveURL('/es/herramientas/ganancia-neta');

  // Every flagged default surfaces with its basis and verification date.
  await expect(page.getByText('commissionRatePct')).toBeVisible();
  await expect(page.getByText('titlePaidBySeller')).toBeVisible();
  await expect(
    page.getByText(UI.calc.basisUnconfirmedDefault.es).first()
  ).toBeVisible();
  await expect(page.getByText('19 jul 2026').first()).toBeVisible();
});

test('client-side computation: headline recomputes from input edits', async ({
  page,
}) => {
  await page.goto('/en/tools/net-proceeds');

  await page.locator('#calc-salePrice').fill('650000');
  const headline = page.getByTestId('calc-headline');
  await expect(headline).toBeVisible();
  const first = await headline.textContent();
  expect(first).toMatch(/^\$[\d,]+/);

  // Result state serializes to the querystring (sharing), canonical stays bare.
  await expect(page).toHaveURL(/salePrice=650000/);

  await page.locator('#calc-salePrice').fill('900000');
  await expect(headline).not.toHaveText(first ?? '');
});

test('"email me this breakdown" posts {inputs, outputs} with tool attribution', async ({
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

  await page.goto('/en/tools/net-proceeds');
  await page.locator('#calc-salePrice').fill('650000');
  await expect(page.getByTestId('calc-headline')).toBeVisible();

  await page.getByText(UI.calc.emailBreakdown.en).click();
  await page.locator('#lead-full-name').fill('Test Seller');
  await page.locator('#lead-email').fill('seller@example.com');
  await page.getByRole('button', { name: UI.form.submit.en }).click();
  await expect(page.getByText(UI.form.successHeading.en)).toBeVisible();

  expect(submission).not.toBeNull();
  const body = submission as unknown as Record<string, unknown>;
  expect(body.sourceType).toBe('tool');
  expect(body.sourceSlug).toBe('net-proceeds');
  expect(body.intent).toBe('sell');
  expect(body.locale).toBe('en');
  expect(String(body.route)).toBe('/en/tools/net-proceeds');

  const payload = body.payload as {
    inputs: Record<string, unknown>;
    outputs: {
      headline: { key: string; amountCents: number };
      oneTimeLines: unknown[];
      monthlyLines: unknown[];
    };
  };
  expect(payload.inputs.salePrice).toBe(650000);
  expect(payload.outputs.headline.key).toBe('netProceeds');
  expect(typeof payload.outputs.headline.amountCents).toBe('number');
  expect(Array.isArray(payload.outputs.oneTimeLines)).toBe(true);
  expect(payload.outputs.oneTimeLines.length).toBeGreaterThan(0);
});

test('cross-locale segments 404', async ({ page }) => {
  for (const path of ['/en/vendedores', '/es/sellers', '/en/herramientas']) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(404);
  }
});
