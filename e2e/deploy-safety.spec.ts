import { expect, test } from '@playwright/test';

/**
 * Dispatch 6b — deployment safety. The served state is decided at BUILD time
 * by NEXT_PUBLIC_SITE_ORIGIN (never NODE_ENV, never a Vercel environment
 * name):
 *
 *   CLOSED (origin unset / empty / the TK_DOMAIN placeholder): robots.txt is a
 *   full disallow with no Sitemap and no Host line; every response carries
 *   x-robots-tag: noindex, nofollow; pages withhold canonical and hreflang
 *   (they would advertise a nonexistent placeholder host).
 *
 *   OPEN (a real origin deliberately configured): the D12 allow list — the
 *   eight named answer-engine agents plus the wildcard, /api/ disallowed —
 *   with Sitemap and Host; the noindex header is absent; no served artifact
 *   carries the placeholder host in a canonical, hreflang, or @id.
 *
 * The spec detects which build it runs against from robots.txt, then pins the
 * FULL contract of that state — both branches assert; neither is vacuous.
 * Unit tests (tests/robots.test.ts) pin both states deterministically.
 */

const D12_AGENTS = [
  'Googlebot',
  'Bingbot',
  'Google-Extended',
  'Applebot-Extended',
  'GPTBot',
  'OAI-SearchBot',
  'ClaudeBot',
  'PerplexityBot',
];

test('robots.txt, the noindex header and served pages agree on one origin state', async ({
  page,
  request,
}) => {
  const robotsResponse = await request.get('/robots.txt');
  expect(robotsResponse.status()).toBe(200);
  const robots = await robotsResponse.text();
  const open = /^sitemap:/im.test(robots);

  const home = await page.goto('/en');
  expect(home?.status()).toBe(200);
  const robotsTag = home?.headers()['x-robots-tag'] ?? '';
  const html = await page.content();

  if (open) {
    // OPEN: the D12 allow list, byte-for-byte agents, /api/ the only disallow.
    for (const agent of D12_AGENTS) {
      expect(robots.toLowerCase()).toContain(`user-agent: ${agent.toLowerCase()}`);
    }
    expect(robots.toLowerCase()).toContain('user-agent: *');
    expect(/^allow: \/$/im.test(robots)).toBe(true);
    expect(/^disallow: \/api\/$/im.test(robots)).toBe(true);
    expect(/^disallow: \/$/im.test(robots)).toBe(false);
    expect(/^host:/im.test(robots)).toBe(true);

    // Indexability open: no noindex header on the document.
    expect(robotsTag).not.toContain('noindex');

    // No built artifact resolves on the placeholder host.
    expect(html).not.toContain('TK_DOMAIN.example');
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  } else {
    // CLOSED: full disallow for every agent; nothing advertised.
    expect(/^user-agent: \*$/im.test(robots)).toBe(true);
    expect(/^disallow: \/$/im.test(robots)).toBe(true);
    expect(/^allow:/im.test(robots)).toBe(false);
    expect(/^sitemap:/im.test(robots)).toBe(false);
    expect(/^host:/im.test(robots)).toBe(false);

    // Indexability closed on every response — the document AND robots.txt itself.
    expect(robotsTag).toContain('noindex');
    expect(robotsTag).toContain('nofollow');
    expect(robotsResponse.headers()['x-robots-tag'] ?? '').toContain('noindex');

    // No canonical/hreflang advertising a nonexistent host; no raw marker.
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
    expect(html).not.toMatch(/\bTK_DOMAIN/);
  }
});

test('the es document carries the same header state as en', async ({ page, request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  const open = /^sitemap:/im.test(robots);

  const response = await page.goto('/es');
  expect(response?.status()).toBe(200);
  const robotsTag = response?.headers()['x-robots-tag'] ?? '';
  if (open) {
    expect(robotsTag).not.toContain('noindex');
    expect(await page.content()).not.toContain('TK_DOMAIN.example');
  } else {
    expect(robotsTag).toContain('noindex');
    expect(await page.content()).not.toMatch(/\bTK_DOMAIN/);
  }
});
