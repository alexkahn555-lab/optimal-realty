import type { MetadataRoute } from 'next';
import { ORIGIN_IS_PLACEHOLDER, SITE_ORIGIN } from '@/config/origin';

/**
 * Closed by default (6b). Until a real origin is configured, the site is
 * placeholders and fixtures under a licensed broker's name — no crawler gets
 * an allow, and nothing advertises a Sitemap or Host. The D12 allow list
 * below (being retrievable and citable by answer engines is the launch
 * strategy) opens only when the origin is deliberately configured; the switch
 * is never NODE_ENV or a Vercel environment name.
 */
export default function robots(): MetadataRoute.Robots {
  if (ORIGIN_IS_PLACEHOLDER) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  const bots = [
    'Googlebot',
    'Bingbot',
    'Google-Extended',
    'Applebot-Extended',
    'GPTBot',
    'OAI-SearchBot',
    'ClaudeBot',
    'PerplexityBot',
  ];

  return {
    rules: [
      ...bots.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: '/api/',
      })),
      { userAgent: '*', allow: '/', disallow: '/api/' },
    ],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}
