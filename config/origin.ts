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
const PLACEHOLDER_ORIGIN = 'https://TK_DOMAIN.example';

// Trimmed so an accidental '' or whitespace override cannot open the site.
const configured = (process.env.NEXT_PUBLIC_SITE_ORIGIN ?? '').trim();

export const SITE_ORIGIN: string = configured === '' ? PLACEHOLDER_ORIGIN : configured;

/**
 * True until a real origin is deliberately configured (D-06 stays the
 * client's call). Everything that would advertise a host — the robots allow
 * list, Sitemap/Host lines, canonicals, hreflang alternates, og:url, the
 * x-robots-tag gate in next.config.mjs — keys off this condition and stays
 * closed while it holds. The switch is origin configuration, never NODE_ENV
 * and never a Vercel environment name: a production deploy with no domain
 * configured is still closed.
 */
export const ORIGIN_IS_PLACEHOLDER: boolean = SITE_ORIGIN.includes(
  PLACEHOLDER_ORIGIN.slice('https://'.length)
);

export const LOCALES = ['en', 'es'] as const;
export const DEFAULT_LOCALE = 'en' as const; // x-default target
