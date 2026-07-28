import { describe, expect, it } from 'vitest';
import { clampDescription, metaFor } from '@/lib/seo/meta';

describe('clampDescription()', () => {
  it('caps at 155 on a word boundary', () => {
    const long = 'word '.repeat(60).trim();
    const out = clampDescription(long);
    expect(out.length).toBeLessThanOrEqual(155);
    expect(long.startsWith(out)).toBe(true);
  });

  it('leaves a short description unchanged', () => {
    expect(clampDescription('Short.')).toBe('Short.');
  });
});

describe('metaFor()', () => {
  it('shape for home (no title)', () => {
    const m = metaFor(
      { id: 'home', description: { en: 'English desc.', es: 'Descripción.' } },
      'en'
    );
    expect(m.title).toBeUndefined();
    expect(m.description).toBe('English desc.');
    expect(m.robots).toEqual({ index: true, follow: true });
    expect((m.openGraph as { locale?: string }).locale).toBe('en_US');

    const alternates = m.alternates as {
      canonical?: string;
      languages?: Record<string, string>;
    };
    const langs = alternates.languages ?? {};
    expect(Object.keys(langs)).toEqual(
      expect.arrayContaining(['en', 'es', 'x-default'])
    );
    expect(String(langs.en).endsWith('/en')).toBe(true);
    expect(String(langs.es).endsWith('/es')).toBe(true);
    expect(langs['x-default']).toBe(langs.en);
    expect(String(alternates.canonical).endsWith('/en')).toBe(true);
  });

  it('es uses es_US and an es canonical', () => {
    const m = metaFor({ id: 'home', description: { en: 'a', es: 'b' } }, 'es');
    expect((m.openGraph as { locale?: string }).locale).toBe('es_US');
    const alternates = m.alternates as { canonical?: string };
    expect(String(alternates.canonical).endsWith('/es')).toBe(true);
    expect(m.description).toBe('b');
  });

  it('a provided title fills the bare title', () => {
    const m = metaFor(
      {
        id: 'about',
        title: { en: 'About', es: 'Nosotros' },
        description: { en: 'a', es: 'b' },
      },
      'en'
    );
    expect(m.title).toBe('About');
  });

  /**
   * Dispatch 5b — a raw TK_ string must never reach a description or og tag.
   * A TK description falls back to the entity title (the 4c sold-index
   * fallback, now centralized here so every call site is covered).
   */
  describe('TK description fallback', () => {
    const tkDescription = { en: 'TK_PORTAL_X_ANSWER', es: 'TK_PORTAL_X_ANSWER' };

    it('falls back to the title in description AND og:description', () => {
      for (const locale of ['en', 'es'] as const) {
        const m = metaFor(
          { id: 'about', title: { en: 'About', es: 'Nosotros' }, description: tkDescription },
          locale
        );
        expect(m.description).toBe(locale === 'en' ? 'About' : 'Nosotros');
        expect((m.openGraph as { description?: string }).description).toBe(
          locale === 'en' ? 'About' : 'Nosotros'
        );
      }
    });

    it('a marker in ONE locale is unfilled — both locales fall back', () => {
      const m = metaFor(
        {
          id: 'about',
          title: { en: 'About', es: 'Nosotros' },
          description: { en: 'Real prose.', es: 'TK_HALF_FILLED' },
        },
        'en'
      );
      expect(m.description).toBe('About');
    });

    it('no title to fall back to → the site name, never the marker', () => {
      const m = metaFor({ id: 'home', description: tkDescription }, 'en');
      expect(m.description).toBe('Optimal Realty');
    });

    it('emits no TK_ anywhere in the metadata object', () => {
      const m = metaFor(
        { id: 'about', title: { en: 'About', es: 'Nosotros' }, description: tkDescription },
        'en'
      );
      expect(JSON.stringify(m)).not.toMatch(/\bTK_/);
    });
  });
});
