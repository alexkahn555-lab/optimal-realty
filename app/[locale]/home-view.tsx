import { ENTITY, LICENSE_LABEL, POSITIONING } from '@/config/entity';
import { SITE_ORIGIN } from '@/config/origin';
import { SELLERS_PORTAL } from '@/content/portals/sellers';
import { UI } from '@/content/ui-strings';
import { t } from '@/lib/i18n';
import { href } from '@/lib/seo/href';
import { pageGraph, webPageNode } from '@/lib/seo/jsonld';
import { SITE_NAME } from '@/lib/seo/meta';
import { localizedClean } from '@/lib/content/loaders';
import type { Locale, Localized, PortalId } from '@/lib/types';
import { AnswerBlock, JsonLd, PlaceholderTK } from '@/components/seo';
import { Hairline, Heading, Section } from '@/components/primitives';
import { LeadCta } from '@/components/portal/LeadCta';
import { RelatedListings } from '@/components/portal/RelatedListings';

/**
 * HOME VIEW (D4) — the front door. Base class (Part 8.1): no hero photograph,
 * the LCP is the H1 text, and the ONLY island is the LeadForm via its lazy
 * boundary (LeadCta → LeadFormLazy). Statically imported by the home page —
 * /[locale] is its own segment entry, so nothing here can ride into other
 * routes.
 *
 * The answer PROSE is client-facing brokerage copy — never agent-authored
 * (Part 1.4). It exists as a TK_ placeholder (visible in preview, absent in
 * strict/production builds) until supplied. The H1 QUESTION is structural
 * chrome and renders; the WebPage node's description drops via stripTK.
 *
 * Portal entries: Sellers is real (title + answer question from its content
 * file). The other four are REGISTERED routes with no content until Phase 5 —
 * they render label-only links (labels mirror PORTAL_SEG in lib/seo/href.ts)
 * with NO invented blurb: an unbuilt portal gets no description, period.
 */

/** Answer freshness date — bump when the answer copy changes. */
const HOME_UPDATED = '2026-07-27' as const;

const HOME_ANSWER = {
  question: { en: 'What is Optimal Realty?', es: '¿Qué es Optimal Realty?' },
  answer: {
    en: 'TK_HOME_ANSWER',
    es: 'TK_HOME_ANSWER',
  },
  updated: HOME_UPDATED,
};

/**
 * Labels for the four Phase 5 portals (chrome, mirrors PORTAL_SEG; the
 * sellers entry uses its content title instead). Local to the home view —
 * content/ui-strings.ts is outside this dispatch's allowlist.
 */
const PENDING_PORTAL_LABEL: Record<Exclude<PortalId, 'sellers'>, Localized> = {
  buyers: { en: 'Buyers', es: 'Compradores' },
  investors: { en: 'Investors', es: 'Inversionistas' },
  landlords: { en: 'Landlords', es: 'Arrendadores' },
  tenants: { en: 'Tenants', es: 'Inquilinos' },
};

export function HomeView({ locale }: { locale: Locale }): JSX.Element {
  const url = `${SITE_ORIGIN}${href('home', locale)}`;
  const licenseLine = [
    ENTITY.entity.founder.name,
    ...ENTITY.entity.licenses.map(
      (license) => `${LICENSE_LABEL[license.role]} ${license.number}`
    ),
  ].join(' · ');

  return (
    <Section className="py-16 md:py-24">
      <div className="space-y-14">
        {/* Answer-first front door: the H1 question is the LCP. */}
        <div>
          <Heading level={1}>{t(HOME_ANSWER.question, locale)}</Heading>
          <div className="mt-6">
            {localizedClean(HOME_ANSWER.answer) ? (
              <AnswerBlock block={HOME_ANSWER} locale={locale} />
            ) : (
              <PlaceholderTK id="HOME_ANSWER" />
            )}
          </div>
        </div>

        {/* The five portals + tools — the site's spine. */}
        <nav aria-label={SITE_NAME}>
          <ul>
            <li className="border-b border-hair">
              <a className="block py-5" href={href('portal.sellers', locale)}>
                <span className="font-display text-2xl text-ink underline">
                  {t(SELLERS_PORTAL.title, locale)}
                </span>
                <span className="mt-1 block max-w-prose font-sans text-sm text-marine">
                  {t(SELLERS_PORTAL.answer.question, locale)}
                </span>
              </a>
            </li>
            {(
              Object.keys(PENDING_PORTAL_LABEL) as (keyof typeof PENDING_PORTAL_LABEL)[]
            ).map((portalId) => (
              <li key={portalId} className="border-b border-hair">
                {/* Label-only: no blurb exists until the portal's content does. */}
                <a
                  className="block py-5 font-display text-2xl text-ink"
                  href={href(`portal.${portalId}`, locale)}
                >
                  {t(PENDING_PORTAL_LABEL[portalId], locale)}
                </a>
              </li>
            ))}
            <li className="border-b border-hair">
              <a className="block py-5" href={href('tools', locale)}>
                <span className="font-display text-2xl text-ink underline">
                  {t(UI.nav.tools, locale)}
                </span>
                <span className="mt-1 block max-w-prose font-sans text-sm text-marine">
                  {t(UI.toolsHub.question, locale)}
                </span>
              </a>
            </li>
          </ul>
        </nav>

        {/* Featured listings — the active fixtures light this up (zero JS). */}
        <RelatedListings mode="active" limit={2} locale={locale} />

        {/* Credential strip — confirmed facts from the single entity source. */}
        <div>
          <Hairline />
          <p className="mt-4 font-mono text-xs uppercase tracking-wider text-marine">
            {licenseLine}
          </p>
          <p className="mt-1 font-mono text-xs uppercase tracking-wider text-marine">
            {POSITIONING.serviceArea}
          </p>
        </div>

        <LeadCta locale={locale} sourceType="contact" intent="general" />
      </div>
      <JsonLd
        graph={pageGraph([
          webPageNode(
            SITE_NAME,
            t(HOME_ANSWER.answer, locale),
            url,
            locale,
            HOME_UPDATED
          ),
        ])}
      />
    </Section>
  );
}
