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
 *    A TK_ answer (publishable in report mode since 5b) falls back to the title,
 *    then the site name — a raw marker never reaches a description or og tag.
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

/**
 * A Localized value is usable when NEITHER locale carries a TK_ marker — the
 * localizedClean contract (lib/content/loaders.ts), restated here with the
 * same local-regex idiom as lib/seo/jsonld.ts so the SEO layer never imports
 * the content collections.
 */
const TK = /\bTK_/;
const tkClean = (value?: Localized): value is Localized =>
  value !== undefined && !TK.test(value.en) && !TK.test(value.es);

export function metaFor(input: MetaInput, locale: Locale): Metadata {
  const canonical = `${SITE_ORIGIN}${href(input.id, locale)}`;
  const enUrl = `${SITE_ORIGIN}${href(input.id, 'en')}`;
  const esUrl = `${SITE_ORIGIN}${href(input.id, 'es')}`;
  // 5b: a TK answer publishes in report mode, so the fallback chain (the 4c
  // sold-index pattern, centralized) runs on every call site: answer → title
  // → site name. A raw marker never reaches a description or og tag.
  const descriptionSource = tkClean(input.description)
    ? input.description
    : tkClean(input.title)
      ? input.title
      : undefined;
  const description = clampDescription(
    descriptionSource ? descriptionSource[locale] : SITE_NAME
  );

  // 5c: portal titles may themselves be unfilled (publishable in report mode
  // like the answer). A TK title never fills the %s template or an og:title —
  // the page falls to the layout default (bare site name).
  const pageTitle = tkClean(input.title) ? input.title[locale] : undefined;
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
