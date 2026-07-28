import { expect, test, type Page } from '@playwright/test';
import { LISTING_L_2026_001 } from '../content/listings/l-2026-001';
import { LISTING_L_2026_002 } from '../content/listings/l-2026-002';
import { UI } from '../content/ui-strings';

/**
 * Listings e2e (Phase 4a DoD): index + one report in both locales at both
 * viewports (screenshots committed); LCP contract on the report hero; the
 * privacy toggle proven in the served DOM + JSON-LD; served image weights
 * under the Part 8.3 budgets; lead attribution {sourceType:'listing',
 * sourceSlug} through a route-level mock; and the M6 deep link landing on the
 * calculator prefilled. Live providers are never touched from CI.
 */

const REPORT = LISTING_L_2026_001; // full-address fixture
const PRIVATE = LISTING_L_2026_002; // privacy-degraded fixture

const REPORT_PATHS = {
  en: `/en/listings/${REPORT.slug}`,
  es: `/es/propiedades/${REPORT.slug}`,
} as const;

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 900 },
] as const;

const PAGES = [
  {
    name: 'listings-index',
    heading: UI.nav.listings,
    paths: { en: '/en/listings', es: '/es/propiedades' },
  },
  {
    // Address headings are locale-invariant.
    name: 'listing-report',
    heading: { en: '100 Fixture Boulevard', es: '100 Fixture Boulevard' },
    paths: REPORT_PATHS,
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

test('index cards link into the reports; first card is eager, rest lazy', async ({
  page,
}) => {
  await page.goto('/en/listings');
  const cardImages = page.locator('main img');
  await expect(cardImages).toHaveCount(2);
  await expect(cardImages.first()).not.toHaveAttribute('loading', 'lazy');
  await expect(cardImages.nth(1)).toHaveAttribute('loading', 'lazy');

  await page
    .getByRole('link', { name: /100 Fixture Boulevard/ })
    .click();
  await expect(page).toHaveURL(REPORT_PATHS.en);
});

test('report LCP: hero preloaded with explicit dimensions; gallery lazy', async ({
  page,
}) => {
  await page.goto(REPORT_PATHS.en);

  // The priority hero: preload hint in <head>, explicit w/h, not lazy.
  expect(
    await page.locator('link[rel="preload"][as="image"]').count()
  ).toBeGreaterThan(0);
  const hero = page.locator('main img').first();
  await expect(hero).toHaveAttribute('width', String(REPORT.media[0]!.w));
  await expect(hero).toHaveAttribute('height', String(REPORT.media[0]!.h));
  await expect(hero).not.toHaveAttribute('loading', 'lazy');

  // Every non-hero asset lazy-loads.
  await expect(page.locator('main img[loading="lazy"]')).toHaveCount(
    REPORT.media.length - 1
  );
});

/** Sum the transferred bytes of every optimized-image response. */
async function trackImageBytes(page: Page): Promise<() => number> {
  let total = 0;
  page.on('response', (response) => {
    if (!response.url().includes('/_next/image')) return;
    void response
      .body()
      .then((body) => {
        total += body.byteLength;
      })
      .catch(() => undefined);
  });
  return () => total;
}

test('report initial-viewport image weight ≤ 500 KB (Part 8.3)', async ({
  page,
}) => {
  const bytes = await trackImageBytes(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(REPORT_PATHS.en, { waitUntil: 'networkidle' });
  // No scrolling: lazy below-fold media must not have been fetched.
  expect(bytes()).toBeGreaterThan(0);
  expect(bytes()).toBeLessThanOrEqual(500 * 1024);
});

test('index full-page image weight ≤ 900 KB (Part 8.3)', async ({ page }) => {
  const bytes = await trackImageBytes(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/en/listings', { waitUntil: 'networkidle' });
  // Force every lazy card image before weighing.
  await page.mouse.wheel(0, 10_000);
  await page.waitForLoadState('networkidle');
  expect(bytes()).toBeGreaterThan(0);
  expect(bytes()).toBeLessThanOrEqual(900 * 1024);
});

test('privacy toggle: the degraded listing leaks no street line anywhere', async ({
  page,
}) => {
  await page.goto(`/en/listings/${PRIVATE.slug}`);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Miami, FL 33131' })
  ).toBeVisible();

  // Whole served document — DOM, meta, and every JSON-LD script.
  const html = await page.content();
  expect(html).not.toContain(PRIVATE.address.line1);
  expect(html).not.toContain(`#${PRIVATE.address.unit}`);
  expect(html).not.toContain('"streetAddress"');
  expect(html).toContain('"addressLocality":"Miami"');
  expect(html).toContain('"postalCode":"33131"');
});

test('M14 lead attribution: {sourceType listing, sourceSlug} posted', async ({
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

  await page.goto(REPORT_PATHS.en);
  await page.locator('#lead-full-name').fill('Test Buyer');
  await page.locator('#lead-email').fill('buyer@example.com');
  await page.getByRole('button', { name: UI.form.submit.en }).click();
  await expect(page.getByText(UI.form.successHeading.en)).toBeVisible();

  expect(submission).not.toBeNull();
  const body = submission as unknown as Record<string, unknown>;
  expect(body.sourceType).toBe('listing');
  expect(body.sourceSlug).toBe(REPORT.slug);
  expect(body.intent).toBe('buy');
  expect(body.locale).toBe('en');
  expect(String(body.route)).toBe(REPORT_PATHS.en);
});

test('M6 deep link lands on the calculator with the listing prefilled', async ({
  page,
}) => {
  await page.goto(REPORT_PATHS.en);
  await page
    .getByRole('link', { name: /adjust assumptions/i })
    .click();
  await expect(page).toHaveURL(/\/en\/tools\/net-proceeds\?/);
  await expect(page.locator('#calc-salePrice')).toHaveValue(
    String(REPORT.price)
  );
  // The prefilled state computes immediately.
  await expect(page.getByTestId('calc-headline')).toBeVisible();
});

test('sitemap and llms.txt keep the indexes but list ZERO fixture listings (4c)', async ({
  request,
}) => {
  // Fixtures stay routable for template review but never enter a discovery
  // surface — a demonstration listing that crawlers can find reads as a real
  // property or transaction.
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('/en/listings</loc>');
  expect(sitemap).not.toContain(REPORT.slug);
  expect(sitemap).not.toContain(PRIVATE.slug);
  expect(sitemap).not.toContain('300-example-court');

  const llms = await (await request.get('/llms.txt')).text();
  expect(llms).toContain('- Listings:');
  expect(llms).toContain('- Sold listings:');
  expect(llms).not.toContain('- 100 Fixture Boulevard:');
  expect(llms).not.toContain('- Miami, FL 33131:');
  expect(llms).not.toContain('300 Example Court');
  expect(llms).not.toContain('200 Placeholder Way');
});
