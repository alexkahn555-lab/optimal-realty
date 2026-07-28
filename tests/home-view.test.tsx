import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SELLERS_PORTAL } from '@/content/portals/sellers';
import { HomeView } from '@/app/[locale]/home-view';

/**
 * D4 — the home router: five portal entries (Sellers real, four label-only —
 * an unbuilt portal gets NO invented blurb), the tools entry, featured
 * listings from the active fixtures, the credential strip, one lead CTA, and
 * a WebPage node. Zero raw TK_ markers on the page; the answer PROSE is
 * client copy and exists only as a visible placeholder until supplied (4c).
 */

describe('HomeView', () => {
  const en = renderToStaticMarkup(<HomeView locale="en" />);
  const es = renderToStaticMarkup(<HomeView locale="es" />);

  it('renders the H1 question; the answer prose is a placeholder, never agent-written', () => {
    expect(en).toContain('What is Optimal Realty?');
    expect(es).toContain('¿Qué es Optimal Realty?');
    // Visible placeholder in preview — no agent-authored brokerage copy.
    expect(en).toContain('HOME_ANSWER'); // ⟨ TK · HOME_ANSWER ⟩
    expect(es).toContain('HOME_ANSWER');
    expect(en).not.toContain('state-certified appraiser');
  });

  it('renders all five portal entries — only Sellers carries a blurb', () => {
    expect(en).toContain('href="/en/sellers"');
    expect(en).toContain(SELLERS_PORTAL.answer.question.en);
    for (const [seg, label] of [
      ['buyers', 'Buyers'],
      ['investors', 'Investors'],
      ['landlords', 'Landlords'],
      ['tenants', 'Tenants'],
    ]) {
      expect(en).toContain(`href="/en/${seg}"`);
      expect(en).toContain(label);
    }
    // No fabricated copy: the pending entries are bare label links.
    const pendingEntry = en.match(
      /<a[^>]*href="\/en\/buyers"[^>]*>([\s\S]*?)<\/a>/
    );
    expect(pendingEntry).not.toBeNull();
    expect(pendingEntry![1]).toBe('Buyers');
  });

  it('localizes the four pending labels in Spanish', () => {
    for (const [seg, label] of [
      ['compradores', 'Compradores'],
      ['inversionistas', 'Inversionistas'],
      ['arrendadores', 'Arrendadores'],
      ['inquilinos', 'Inquilinos'],
    ]) {
      expect(es).toContain(`href="/es/${seg}"`);
      expect(es).toContain(label);
    }
  });

  it('renders the tools entry with the confirmed tools-hub question', () => {
    expect(en).toContain('href="/en/tools"');
    expect(en).toContain('Which real estate calculators does Optimal Realty offer?');
  });

  it('features the active fixtures and links their reports', () => {
    expect(en).toContain('/en/listings/100-fixture-boulevard-coral-gables');
    expect(en).toContain('/en/listings/fixture-condo-miami-33131');
    // The sold fixture is not "featured" inventory.
    expect(en).not.toContain('300-example-court');
  });

  it('renders the credential strip and the lead CTA', () => {
    expect(en).toContain('BK3446865');
    expect(en).toContain('RD8416');
    expect(en).toContain('CAM64581');
    expect(en).toContain('Miami-Dade County, Florida');
    expect(en).toContain('Talk to a licensed broker');
  });

  it('emits a WebPage node and no TK marker', () => {
    expect(en).toContain('"@type":"WebPage"');
    expect(en).not.toContain('TK_');
    expect(en).not.toContain('"@type":"RealEstateListing"');
  });
});
