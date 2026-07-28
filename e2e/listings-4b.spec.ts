import { expect, test } from '@playwright/test';
import { LISTING_L_2026_001 } from '../content/listings/l-2026-001';
import { LISTING_L_2026_003 } from '../content/listings/l-2026-003';

/**
 * Phase 4b e2e: home + sold index + sold detail (both locales, both
 * viewports, screenshots committed); the lightbox loads its overlay chunk on
 * FIRST CLICK only; the map facade is static until clicked; the completed
 * report modules render; the OG endpoint serves the branded card; sold pages
 * carry no Offer.
 */

const REPORT_EN = `/en/listings/${LISTING_L_2026_001.slug}`;
const SOLD_EN = `/en/listings/${LISTING_L_2026_003.slug}`;

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 900 },
] as const;

const PAGES = [
  {
    name: 'home',
    heading: { en: 'What is Optimal Realty?', es: '¿Qué es Optimal Realty?' },
    paths: { en: '/en', es: '/es' },
  },
  {
    name: 'sold-index',
    heading: { en: 'Sold listings', es: 'Propiedades vendidas' },
    paths: { en: '/en/listings/sold', es: '/es/propiedades/vendidas' },
  },
  {
    name: 'sold-detail',
    heading: { en: '300 Example Court', es: '300 Example Court' },
    paths: {
      en: SOLD_EN,
      es: `/es/propiedades/${LISTING_L_2026_003.slug}`,
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

test('lightbox: overlay JS loads on first click only, then opens and closes', async ({
  page,
}) => {
  const scriptUrls: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'script') scriptUrls.push(request.url());
  });

  await page.goto(REPORT_EN, { waitUntil: 'networkidle' });
  const loadedAtStart = scriptUrls.length;
  await expect(page.getByTestId('lightbox-overlay')).toHaveCount(0);

  // First click: fetches the overlay chunk, then opens at the clicked image.
  await page.locator('main img').first().click();
  await expect(page.getByTestId('lightbox-overlay')).toBeVisible();
  expect(
    scriptUrls.length,
    'the overlay chunk must be fetched only after the click'
  ).toBeGreaterThan(loadedAtStart);

  await expect(page.getByText('1 / 4')).toBeVisible();
  await page.getByRole('button', { name: 'Next image' }).click();
  await expect(page.getByText('2 / 4')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByTestId('lightbox-overlay')).toHaveCount(0);
});

test('map facade: static until clicked, then the OSM iframe mounts', async ({
  page,
}) => {
  await page.goto(REPORT_EN);
  await expect(page.locator('iframe')).toHaveCount(0);
  const load = page.getByRole('button', { name: /load interactive map/i });
  await expect(load).toBeVisible();
  await load.click();
  await expect(
    page.locator('iframe[src*="openstreetmap.org"]')
  ).toHaveCount(1);
});

test('completed report renders the 4b modules (price history, features, narrative TK)', async ({
  page,
}) => {
  await page.goto(REPORT_EN);
  // The demonstration banner opens every fixture report (4c).
  await expect(page.getByTestId('fixture-banner')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Price history' })
  ).toBeVisible();
  await expect(page.locator('svg path.stroke-teal')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Features' })).toBeVisible();
  await expect(page.getByText('Impact-resistant windows')).toBeVisible();
  // Narrative is broker-authored → visible TK placeholder in preview.
  await expect(
    page.getByRole('heading', { name: 'About this property' })
  ).toBeVisible();
  await expect(page.getByText('⟨ TK · L-2026-001_NARRATIVE ⟩')).toBeVisible();
});

test('sold detail: demonstration + sold banners; NO scorecard; no Offer', async ({
  page,
}) => {
  await page.goto(SOLD_EN);
  // The fixture truth label opens the page (4c).
  await expect(page.getByTestId('fixture-banner')).toBeVisible();
  await expect(page.getByText('Demonstration listing')).toBeVisible();
  await expect(page.getByText('Transaction closed May 29, 2026.')).toBeVisible();
  await expect(
    page.getByText('Optimal Realty represented the seller.')
  ).toBeVisible();
  // No scorecard: a fixture registers no professional assessment (4c) — M7
  // renders null; its rendering contract is proven in unit tests inline.
  await expect(page.getByText("Broker's scorecard")).toHaveCount(0);

  const html = await page.content();
  expect(html).toContain('"@type":"WebPage"');
  expect(html).not.toContain('"@type":"RealEstateListing"');
  expect(html).not.toContain('"@type":"Offer"');
});

test('sold index links the sold fixture; active index does not list it', async ({
  page,
}) => {
  await page.goto('/en/listings/sold');
  await page.getByRole('link', { name: /300 Example Court/ }).click();
  await expect(page).toHaveURL(SOLD_EN);

  await page.goto('/en/listings');
  await expect(page.getByText('300 Example Court')).toHaveCount(0);
});

test('fixtures get NO share card: OG endpoint 404s, page references none (4c)', async ({
  page,
  request,
}) => {
  // A share image is a discovery artifact — a demonstration listing must
  // never travel as a real property. The route guard 404s fixture slugs and
  // the page metadata omits og:image entirely.
  const response = await request.get(
    `/listings/${LISTING_L_2026_001.slug}/opengraph-image`
  );
  expect(response.status()).toBe(404);

  await page.goto(REPORT_EN);
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
});

test('home: five portal entries (only Sellers with a blurb), listings, lead form', async ({
  page,
}) => {
  await page.goto('/en');
  await expect(
    page.getByRole('link', { name: /Sellers How do I sell a home/ })
  ).toBeVisible();
  for (const label of ['Buyers', 'Investors', 'Landlords', 'Tenants']) {
    await expect(page.getByRole('link', { name: label, exact: true })).toBeVisible();
  }
  // INVERTED by dispatch 5d (explicitly sanctioned): the home featured rail
  // previously surfaced the active fixtures; a demonstration listing never
  // sits in a proof position. The fixtures stay on the listings index.
  await expect(page.getByRole('link', { name: /100 Fixture Boulevard/ })).toHaveCount(
    0
  );
  await expect(page.locator('#lead-full-name')).toBeVisible();

  // The front door routes into the seller journey.
  await page.getByRole('link', { name: /Sellers How do I sell a home/ }).click();
  await expect(page).toHaveURL('/en/sellers');
});
