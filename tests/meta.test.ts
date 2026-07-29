import { afterEach, describe, expect, it, vi } from 'vitest';
import { SITE_ORIGIN } from '@/config/origin';
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

  /**
   * Dispatch 5c — portal titles may themselves be unfilled (publishable in
   * report mode). A TK title never fills the bare title, an og:title, or the
   * description fallback chain — the page falls to the layout default.
   */
  describe('TK title fallback (5c)', () => {
    const tkTitle = { en: 'TK_PORTAL_X_TITLE', es: 'TK_PORTAL_X_TITLE' };

    it('never fills the bare title or og:title — layout default wins', () => {
      const m = metaFor(
        {
          id: 'portal.buyers',
          title: tkTitle,
          description: { en: 'Real prose.', es: 'Prosa real.' },
        },
        'en'
      );
      expect(m.title).toBeUndefined();
      expect((m.openGraph as { title?: string }).title).toBe('Optimal Realty');
      expect(m.description).toBe('Real prose.');
    });

    it('TK title AND TK description → the site name, no TK_ anywhere', () => {
      for (const locale of ['en', 'es'] as const) {
        const m = metaFor(
          {
            id: 'portal.buyers',
            title: tkTitle,
            description: { en: 'TK_PORTAL_X_ANSWER', es: 'TK_PORTAL_X_ANSWER' },
          },
          locale
        );
        expect(m.title).toBeUndefined();
        expect(m.description).toBe('Optimal Realty');
        expect((m.openGraph as { description?: string }).description).toBe(
          'Optimal Realty'
        );
        expect(JSON.stringify(m)).not.toMatch(/\bTK_/);
      }
    });

    it('a marker in ONE title locale is unfilled — both locales fall back', () => {
      const m = metaFor(
        {
          id: 'portal.buyers',
          title: { en: 'Buyers', es: 'TK_HALF_FILLED_TITLE' },
          description: { en: 'Real prose.', es: 'Prosa real.' },
        },
        'en'
      );
      expect(m.title).toBeUndefined();
    });
  });

  /**
   * Dispatch 6b — a placeholder origin must never be advertised. With no real
   * origin configured, canonical, the hreflang alternates and og:url are
   * withheld entirely (they would point at a nonexistent host); with a real
   * origin, every absolute URL resolves on it and the placeholder host appears
   * nowhere. The robots meta stays index,follow in both states — noindex is
   * owned by the x-robots-tag header (one mechanism, not two).
   */
  describe('origin gating (6b)', () => {
    const ENV_KEY = 'NEXT_PUBLIC_SITE_ORIGIN';
    const initial = process.env[ENV_KEY];

    afterEach(() => {
      if (initial === undefined) delete process.env[ENV_KEY];
      else process.env[ENV_KEY] = initial;
      vi.resetModules();
    });

    /** metaFor with the origin env cleared — a fresh module graph each time. */
    async function metaWithPlaceholderOrigin() {
      delete process.env[ENV_KEY];
      vi.resetModules();
      const { metaFor: freshMetaFor } = await import('@/lib/seo/meta');
      return freshMetaFor(
        { id: 'home', description: { en: 'English desc.', es: 'Descripción.' } },
        'en'
      );
    }

    it('placeholder origin: canonical, hreflang and og:url are withheld', async () => {
      const m = await metaWithPlaceholderOrigin();
      expect(m.alternates).toBeUndefined();
      expect((m.openGraph as { url?: string }).url).toBeUndefined();
      expect(JSON.stringify(m)).not.toMatch(/\bTK_/);
    });

    it('placeholder origin: description and og basics survive; robots meta untouched', async () => {
      const m = await metaWithPlaceholderOrigin();
      expect(m.description).toBe('English desc.');
      expect((m.openGraph as { siteName?: string }).siteName).toBe('Optimal Realty');
      expect(m.robots).toEqual({ index: true, follow: true });
    });

    it('configured origin: every absolute URL resolves on it — never the placeholder', () => {
      // setup.ts configures a real origin before any module loads.
      const m = metaFor(
        { id: 'home', description: { en: 'English desc.', es: 'Descripción.' } },
        'en'
      );
      const alternates = m.alternates as {
        canonical?: string;
        languages?: Record<string, string>;
      };
      expect(String(alternates.canonical).startsWith(SITE_ORIGIN)).toBe(true);
      for (const url of Object.values(alternates.languages ?? {})) {
        expect(String(url).startsWith(SITE_ORIGIN)).toBe(true);
      }
      expect(String((m.openGraph as { url?: string }).url).startsWith(SITE_ORIGIN)).toBe(
        true
      );
      expect(JSON.stringify(m)).not.toContain('TK_DOMAIN.example');
    });
  });
});
