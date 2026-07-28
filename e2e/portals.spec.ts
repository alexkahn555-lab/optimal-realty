import { expect, test } from '@playwright/test';
import { UI } from '../content/ui-strings';

/**
 * Dispatch 5c e2e — the four remaining portal hubs live in both locales on
 * the shared template. Every prose field is an unfilled placeholder marker:
 * each hub must serve a VISIBLE placeholder H1 and answer while the document,
 * head and JSON-LD stay free of raw TK_ strings; the head falls back to the
 * site name (title is unfilled too); the LeadForm posts the per-portal
 * attribution preset to a route-level mock (live providers never touched);
 * and all eight URLs sit on both discovery surfaces and resolve from home.
 */

const SITE_NAME = 'Optimal Realty';

const HUBS = [
  {
    id: 'buyers',
    intent: 'buy',
    paths: { en: '/en/buyers', es: '/es/compradores' },
  },
  {
    id: 'investors',
    intent: 'invest',
    paths: { en: '/en/investors', es: '/es/inversionistas' },
  },
  {
    id: 'landlords',
    intent: 'lease-out',
    paths: { en: '/en/landlords', es: '/es/propietarios' },
  },
  {
    id: 'tenants',
    intent: 'rent',
    paths: { en: '/en/tenants', es: '/es/inquilinos' },
  },
] as const;

for (const hub of HUBS) {
  const marker = `PORTAL_${hub.id.toUpperCase()}`;

  for (const locale of ['en', 'es'] as const) {
    test(`${hub.id} ${locale}: visible question + answer placeholders, zero raw TK_ served`, async ({
      page,
    }) => {
      await page.goto(hub.paths[locale]);
      await expect(
        page.getByRole('heading', {
          level: 1,
          name: `⟨ TK · ${marker}_QUESTION ⟩`,
        })
      ).toBeVisible();
      await expect(page.getByText(`⟨ TK · ${marker}_ANSWER ⟩`)).toBeVisible();
      await expect(
        page.getByText(`⟨ TK · ${marker}_DECISION ⟩`)
      ).toBeVisible();
      const html = await page.content();
      expect(/\bTK_/.test(html), `${hub.paths[locale]} served a raw TK_ marker`).toBe(
        false
      );
    });

    test(`${hub.id} ${locale}: head falls back to the site name — never a marker`, async ({
      page,
    }) => {
      await page.goto(hub.paths[locale]);
      expect(await page.title()).toBe(SITE_NAME);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        SITE_NAME
      );
      await expect(
        page.locator('meta[property="og:title"]')
      ).toHaveAttribute('content', SITE_NAME);
      await expect(
        page.locator('meta[property="og:description"]')
      ).toHaveAttribute('content', SITE_NAME);
    });
  }

  test(`${hub.id}: LeadForm posts {portal_cta, ${hub.id}, ${hub.intent}} to a route-level mock`, async ({
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

    await page.goto(hub.paths.en);
    await page.locator('#lead-full-name').fill('Test Person');
    await page.locator('#lead-email').fill('person@example.com');
    await page.getByRole('button', { name: UI.form.submit.en }).click();
    await expect(page.getByText(UI.form.successHeading.en)).toBeVisible();

    expect(submission).not.toBeNull();
    const body = submission as unknown as Record<string, unknown>;
    expect(body.sourceType).toBe('portal_cta');
    expect(body.portal).toBe(hub.id);
    expect(body.intent).toBe(hub.intent);
    expect(body.locale).toBe('en');
    expect(String(body.route)).toBe(hub.paths.en);
  });
}

test('all eight hub URLs sit on both discovery surfaces — which stay marker-free', async ({
  page,
}) => {
  const sitemap = await (await page.request.get('/sitemap.xml')).text();
  const llms = await (await page.request.get('/llms.txt')).text();
  for (const hub of HUBS) {
    for (const locale of ['en', 'es'] as const) {
      const url = hub.paths[locale];
      expect(sitemap, `sitemap.xml must carry ${url}`).toContain(url);
      expect(llms, `llms.txt must carry ${url}`).toContain(url);
    }
  }
  expect(/\bTK_/.test(sitemap), 'sitemap.xml carries a raw TK_ marker').toBe(false);
  expect(/\bTK_/.test(llms), 'llms.txt carries a raw TK_ marker').toBe(false);
});

test('the four home page links resolve in both locales (the 4b 404s are gone)', async ({
  page,
}) => {
  for (const locale of ['en', 'es'] as const) {
    await page.goto(`/${locale}`);
    for (const hub of HUBS) {
      await expect(
        page.locator(`a[href="${hub.paths[locale]}"]`).first()
      ).toBeVisible();
    }
  }
  for (const hub of HUBS) {
    for (const locale of ['en', 'es'] as const) {
      const response = await page.request.get(hub.paths[locale]);
      expect(response.status(), hub.paths[locale]).toBe(200);
    }
  }
});

test('cross-locale portal segments 404', async ({ page }) => {
  for (const path of [
    '/en/compradores',
    '/es/buyers',
    '/en/inversionistas',
    '/es/investors',
    '/en/propietarios',
    '/es/landlords',
    '/en/inquilinos',
    '/es/tenants',
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(404);
  }
});
