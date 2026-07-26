import type { IsoDate, Localized } from '@/lib/types';

/**
 * LEGAL PAGES — skeletons only (Phase 3, D5). Titles are chrome (authorable);
 * every body is attorney-authored and ships as a placeholder marker rendered as a
 * visible PlaceholderTK in preview and nothing in production. Slugs live in
 * LEGAL_SEG in lib/seo/href.ts (the route registry), not here.
 */

export type LegalSlug = 'privacy' | 'terms' | 'disclosures' | 'accessibility';

export interface LegalPageDef {
  id: LegalSlug;
  title: Localized;
  body: Localized; // placeholder — attorney-authored
  updated: IsoDate;
}

export const LEGAL_SLUGS: readonly LegalSlug[] = [
  'privacy',
  'terms',
  'disclosures',
  'accessibility',
];

export const LEGAL_PAGES: Record<LegalSlug, LegalPageDef> = {
  privacy: {
    id: 'privacy',
    title: { en: 'Privacy policy', es: 'Política de privacidad' },
    body: { en: 'TK_LEGAL_PRIVACY_BODY', es: 'TK_LEGAL_PRIVACY_BODY' },
    updated: '2026-07-26',
  },
  terms: {
    id: 'terms',
    title: { en: 'Terms of use', es: 'Términos de uso' },
    body: { en: 'TK_LEGAL_TERMS_BODY', es: 'TK_LEGAL_TERMS_BODY' },
    updated: '2026-07-26',
  },
  disclosures: {
    id: 'disclosures',
    title: { en: 'Disclosures', es: 'Divulgaciones' },
    body: { en: 'TK_LEGAL_DISCLOSURES_BODY', es: 'TK_LEGAL_DISCLOSURES_BODY' },
    updated: '2026-07-26',
  },
  accessibility: {
    id: 'accessibility',
    title: { en: 'Accessibility statement', es: 'Declaración de accesibilidad' },
    body: {
      en: 'TK_LEGAL_ACCESSIBILITY_BODY',
      es: 'TK_LEGAL_ACCESSIBILITY_BODY',
    },
    updated: '2026-07-26',
  },
};
