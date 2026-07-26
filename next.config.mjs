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
};

export default nextConfig;
