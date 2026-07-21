import { expect, test } from '@playwright/test';
import { UI } from '../content/ui-strings';

/**
 * Contact page e2e: renders in both locales at both viewports (screenshots
 * committed), client-side validation blocks an empty submit, and the form
 * POST is exercised against a route-level mock — live providers are never
 * touched from CI.
 */

const PAGES = [
  { locale: 'en' as const, path: '/en/contact' },
  { locale: 'es' as const, path: '/es/contacto' },
];

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 900 },
];

for (const { locale, path } of PAGES) {
  for (const vp of VIEWPORTS) {
    test(`contact ${locale} ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(path);
      await expect(
        page.getByRole('heading', { level: 1, name: UI.contact.question[locale] })
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: UI.form.submit[locale] })
      ).toBeVisible();
      await page.screenshot({
        path: `e2e/screenshots/contact-${locale}-${vp.name}.png`,
        fullPage: true,
      });
    });
  }
}

test('empty submit is blocked client-side; nothing reaches the network', async ({
  page,
}) => {
  let posted = false;
  await page.route('**/api/leads', async (route) => {
    posted = true;
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'should-not-happen' }),
    });
  });

  await page.goto('/en/contact');
  await page.getByRole('button', { name: UI.form.submit.en }).click();

  await expect(page.locator('#lead-full-name-error')).toHaveText(
    UI.form.requiredError.en
  );
  await expect(page.locator('#lead-email-error')).toHaveText(
    UI.form.requiredError.en
  );
  expect(posted).toBe(false);
});

test('valid submit posts the bound attribution to a route-level mock', async ({
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

  await page.goto('/es/contacto');
  await page.locator('#lead-full-name').fill('Prueba Persona');
  await page.locator('#lead-email').fill('prueba@example.com');
  await page.getByRole('button', { name: UI.form.submit.es }).click();

  await expect(page.getByText(UI.form.successHeading.es)).toBeVisible();
  await expect(page.getByText(UI.form.successBody.es)).toBeVisible();

  expect(submission).not.toBeNull();
  const body = submission as unknown as Record<string, unknown>;
  expect(body.sourceType).toBe('contact');
  expect(body.locale).toBe('es');
  expect(body.route).toBe('/es/contacto');
  expect(body.intent).toBe('general');
  expect(body.fullName).toBe('Prueba Persona');
  expect(body.hp).toBe('');
  expect(typeof body.startedAt).toBe('number');
  expect('sourceSlug' in body).toBe(false);
});

test('unknown section 404s in both locales', async ({ page }) => {
  const responseEn = await page.goto('/en/contacto');
  expect(responseEn?.status()).toBe(404);
  const responseEs = await page.goto('/es/contact');
  expect(responseEs?.status()).toBe(404);
});
