import { test } from '@playwright/test';

const locales = ['en', 'es'] as const;
const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 900 },
] as const;

for (const locale of locales) {
  for (const vp of viewports) {
    test(`${locale} ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`/${locale}`);
      await page.screenshot({
        path: `e2e/screenshots/${locale}-${vp.name}.png`,
        fullPage: true,
      });
    });
  }
}
