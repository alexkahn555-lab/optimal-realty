import { Fraunces, IBM_Plex_Mono, Inter } from 'next/font/google';

/**
 * Self-hosted fonts (next/font/google downloads the woff2 at build → zero CDN
 * requests at runtime). Weights per the design system: Fraunces (display) 500/600,
 * Inter (body) 400/500/600, IBM Plex Mono (every figure) 400/500/600. display: swap.
 * The CSS variables match tailwind.config.ts.
 *
 * SUBSET DEVIATION (see completion report): the dispatch specified `latin + latin-ext`,
 * but next/font preloads every declared subset, and latin-ext ≈ doubled the woff2
 * payload to ~260 KB preloaded — over the ≤140 KB budget — while rendering ZERO glyphs
 * for an EN/ES site (Spanish diacritics á é í ó ú ñ ü ¿ ¡ all live in the `latin`
 * subset). Dropped latin-ext to honor the byte budget with no visible change. If a
 * future locale needs latin-ext glyphs, re-add it there.
 *
 * Shared by the locale layout AND the global not-found (which renders its own
 * document outside the layout), so the font setup stays in one place.
 */

export const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600'],
  display: 'swap',
  variable: '--font-fraunces',
});

export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-inter',
});

export const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-plex-mono',
});

/** Applied to <html> so tailwind's font-display/sans/mono tokens resolve. */
export const fontVariables = `${fraunces.variable} ${inter.variable} ${plexMono.variable}`;
