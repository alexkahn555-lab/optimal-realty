/**
 * Origin gate (6b). Mirrors ORIGIN_IS_PLACEHOLDER in config/origin.ts — this
 * file cannot import TypeScript, so the two-line condition is restated here.
 * Read at call time (not module scope) so headers() sees the env of the build
 * that invokes it.
 */
function originConfigured() {
  const origin = (process.env.NEXT_PUBLIC_SITE_ORIGIN ?? '').trim();
  return origin !== '' && !origin.includes('TK_DOMAIN.example');
}

if (!originConfigured()) {
  console.warn(
    '\n  ⚠ NEXT_PUBLIC_SITE_ORIGIN is unset or still the TK_DOMAIN placeholder (D-06 open).\n' +
      '    Degraded until a real origin is configured: canonicals, hreflang alternates,\n' +
      '    the sitemap, JSON-LD @ids, and email from-addresses. robots.txt serves a full\n' +
      '    disallow and every response carries x-robots-tag: noindex, nofollow.\n'
  );
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Every content route is SSG (D1). No ISR anywhere. If a page ever needs
  // request-time data, that is a data-model error to fix, not a rendering mode
  // to toggle — `export const dynamic = 'force-dynamic'` is banned from page routes.
  images: {
    formats: ['image/avif', 'image/webp'],
    // MediaImage renders every listing asset at quality 65 (Part 8.3). Next 16
    // rejects qualities not listed here (default [75]), so 65 must be declared.
    qualities: [65, 75],
    // Listing photos are repo-committed and processed by scripts/compress-images.mjs.
    // No remote patterns: the site serves no third-party or IDX imagery.
  },
  // ESLint enforcement lives in the prebuild gate chain (npm run lint), not here.
  // Next 16 removed build-time lint; the `eslint` config key is unsupported.
  typescript: {
    ignoreBuildErrors: false,
  },
  // 6b: indexability is closed by default. With no real origin configured,
  // every response bears noindex — the ONE noindex mechanism (robots.ts closes
  // crawling; this closes indexing). The switch is origin configuration, never
  // NODE_ENV or a Vercel environment name, so a production deploy with no
  // domain configured is still closed. Evaluated once per build and baked into
  // the routes manifest.
  async headers() {
    if (originConfigured()) return [];
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default nextConfig;
