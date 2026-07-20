import type { Metadata } from 'next';
import type { Locale, Localized, RouteId } from '@/lib/types';
import { SITE_ORIGIN } from '@/config/origin';
import { href } from '@/lib/seo/href';

/**
 * ============================================================================
 * metaFor() — per-page Next Metadata from a route + localized answer.
 * ============================================================================
 *
 *  - title template `%s | Optimal Realty` (the layout sets it; a page title fills
 *    %s; a page with no title falls to the site name).
 *  - description = the localized answer, clamped to 155 chars on a word boundary.
 *  - canonical = the bare href() URL for this route + locale.
 *  - alternates.languages = en + es + x-default (= en).
 *  - OG locale en_US / es_US; robots index, follow.
 */

export const SITE_NAME = 'Optimal Realty';
export const TITLE_TEMPLATE = `%s | ${SITE_NAME}`;
const DESCRIPTION_MAX = 155;

const OG_LOCALE: Record<Locale, string> = { en: 'en_US', es: 'es_US' };

export interface MetaInput {
  id: RouteId;
  /** Omitted → the layout's default title (bare site name). */
  title?: Localized;
  /** The answer/description; clamped to 155 chars. */
  description: Localized;
}

/** Clamp to <= max chars on a word boundary — never a mid-word cut. */
export function clampDescription(text: string, max = DESCRIPTION_MAX): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= max) return trimmed;
  const slice = trimmed.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > 0 ? slice.slice(0, lastSpace) : slice).trimEnd();
}

export function metaFor(input: MetaInput, locale: Locale): Metadata {
  const canonical = `${SITE_ORIGIN}${href(input.id, locale)}`;
  const enUrl = `${SITE_ORIGIN}${href(input.id, 'en')}`;
  const esUrl = `${SITE_ORIGIN}${href(input.id, 'es')}`;
  const description = clampDescription(input.description[locale]);

  const pageTitle = input.title ? input.title[locale] : undefined;
  const ogTitle = pageTitle ? TITLE_TEMPLATE.replace('%s', pageTitle) : SITE_NAME;

  return {
    // Bare title fills the layout's %s template; omitted → layout default.
    ...(pageTitle ? { title: pageTitle } : {}),
    description,
    alternates: {
      canonical,
      languages: {
        en: enUrl,
        es: esUrl,
        'x-default': enUrl,
      },
    },
    openGraph: {
      title: ogTitle,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale],
      type: 'website',
    },
    robots: { index: true, follow: true },
  };
}
