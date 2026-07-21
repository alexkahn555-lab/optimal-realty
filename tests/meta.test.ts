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
});
