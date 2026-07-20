/**
 * SITE_ORIGIN — the ONLY host constant in the codebase (Part 5.1).
 *
 * Referenced by metadata, JSON-LD @ids, the sitemap, and email templates.
 * Nothing else may hard-code a hostname; check-content.mjs greps the built
 * output for stray absolute hosts.
 *
 * Domain is UNCONFIRMED (D-06). This is what makes the domain decision a
 * one-constant edit rather than surgery across forty routes.
 */
export const SITE_ORIGIN: string =
  process.env.NEXT_PUBLIC_SITE_ORIGIN ?? 'https://TK_DOMAIN.example';

export const LOCALES = ['en', 'es'] as const;
export const DEFAULT_LOCALE = 'en' as const; // x-default target
