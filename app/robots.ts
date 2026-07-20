import type { MetadataRoute } from 'next';
import { SITE_ORIGIN } from '@/config/origin';

export default function robots(): MetadataRoute.Robots {
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
