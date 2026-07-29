import { expect, test } from '@playwright/test';
import { UI } from '../content/ui-strings';

/**
 * Dispatch 7a e2e — the neighborhood template and the R-01 stub gate against
 * the served app: the published fixture serves in both locales behind its
 * demonstration banner with zero raw markers; the stub does not exist as a
 * route (404); the index renders its empty state and links to no fixture;
 * neither fixture nor stub reaches any discovery surface.
 */

const FIXTURE_EN = '/en/neighborhoods/fixture-palms-example';
const FIXTURE_ES = '/es/vecindarios/fixture-palms-example';

for (const { locale, path } of [
  { locale: 'en' as const, path: FIXTURE_EN },
  { locale: 'es' as const, path: FIXTURE_ES },
]) {
  test(`published fixture ${locale}: banner, placeholders, sourced stats, zero raw TK_`, async ({
    page,
  }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);

    // The demonstration banner — visible truth labeling (4c).
    await expect(page.getByTestId('fixture-banner')).toBeVisible();
    await expect(
      page.getByText(UI.fixtureBanner.tag[locale])
    ).toBeVisible();

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: '⟨ TK · NBHD_FIXTURE_PALMS_QUESTION ⟩',
      })
    ).toBeVisible();
    await expect(
      page.getByText('⟨ TK · NBHD_FIXTURE_PALMS_ANSWER ⟩')
    ).toBeVisible();

    // Every stat figure carries its visible invented-source furniture.
    await expect(
      page.getByText(UI.neighborhoodStats.medianSalePrice[locale])
    ).toBeVisible();
    await expect(
      page
        .getByText(
          'Invented fixture figure — template review only, not a market source'
        )
        .first()
    ).toBeVisible();

    expect(await page.title()).toBe('Optimal Realty'); // TK name → site name
    const html = await page.content();
    expect(/\bTK_/.test(html), `${path} served a raw TK_ marker`).toBe(false);
  });
}

test('the stub does not exist as a route — 404 in both locales (R-01)', async ({
  page,
}) => {
  for (const path of [
    '/en/neighborhoods/placeholder-grove-stub',
    '/es/vecindarios/placeholder-grove-stub',
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(404);
  }
});

test('the index serves its empty state and links to no fixture or stub', async ({
  page,
}) => {
  for (const { locale, path } of [
    { locale: 'en' as const, path: '/en/neighborhoods' },
    { locale: 'es' as const, path: '/es/vecindarios' },
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.getByText(UI.neighborhoods.empty[locale])).toBeVisible();
    await expect(
      page.locator('a[href*="fixture-palms-example"]')
    ).toHaveCount(0);
    await expect(
      page.locator('a[href*="placeholder-grove-stub"]')
    ).toHaveCount(0);
    expect(/\bTK_/.test(await page.content()), path).toBe(false);
  }
});

test('discovery surfaces: the index pair only — never a fixture or stub', async ({
  page,
}) => {
  const sitemap = await (await page.request.get('/sitemap.xml')).text();
  const llms = await (await page.request.get('/llms.txt')).text();

  expect(sitemap).toContain('/en/neighborhoods');
  expect(sitemap).toContain('/es/vecindarios');
  expect(sitemap).not.toContain('fixture-palms-example');
  expect(sitemap).not.toContain('placeholder-grove-stub');

  expect(llms.toLowerCase()).not.toContain('neighborhood');
  expect(llms.toLowerCase()).not.toContain('vecindario');
  expect(llms).not.toContain('fixture-palms-example');
  expect(llms).not.toContain('placeholder-grove-stub');
});
