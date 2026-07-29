import { SITE_ORIGIN } from '@/config/origin';
import { UI } from '@/content/ui-strings';
import { neighborhoodLabel } from '@/lib/content/loaders';
import { t } from '@/lib/i18n';
import { href } from '@/lib/seo/href';
import { pageGraph, placeNode, webPageNode } from '@/lib/seo/jsonld';
import {
  AnswerBlock,
  Breadcrumbs,
  FaqSection,
  JsonLd,
  PlaceholderTK,
  buildFaqPageNode,
  type ResolvedFaq,
} from '@/components/seo';
import { Heading, Prose, Section } from '@/components/primitives';
import { LeadCta } from '@/components/portal/LeadCta';
import { PORTAL_INTENT } from '@/components/portal/PortalTemplate';
import type { Locale, Localized, Neighborhood } from '@/lib/types';

import { StatGrid } from './StatGrid';

/**
 * NEIGHBORHOOD TEMPLATE (Part 7.1, dispatch 7a) — RSC through the existing
 * primitives, no fork: Breadcrumbs · H1 (answer.question, PlaceholderTK when
 * unfilled — the 6a-inherited guard) · AnswerBlock · StatGrid · overview ·
 * FaqSection · LeadCta · JsonLd (Place + WebPage; FAQPage only when FAQs
 * exist; NEVER Dataset; BreadcrumbList via the Breadcrumbs component; the
 * agent node is never redeclared). Every slot degrades by omission
 * (Part 7.3): no stats → no StatGrid; no FAQs → no section.
 *
 * NO comparison across neighborhoods exists anywhere here — no ranking, no
 * table, no figure that references another place. Color encodes nothing
 * about the place (tokens only). Demonstration fixtures carry the visible
 * truth banner (the 4c convention, generic wording).
 */

const TK = /\bTK_/;
const isTK = (value: Localized): boolean => TK.test(value.en) || TK.test(value.es);

/** Marker id for PlaceholderTK, prefix dropped (the 4b convention). */
function placeholderId(value: Localized): string {
  return (TK.test(value.en) ? value.en : value.es).replace(TK, '');
}

export interface NeighborhoodTemplateProps {
  neighborhood: Neighborhood;
  /** Resolved from faqIds — TK-clean answers only (caller resolves). */
  faqs: ResolvedFaq[];
  locale: Locale;
}

export function NeighborhoodTemplate({
  neighborhood,
  faqs,
  locale,
}: NeighborhoodTemplateProps): JSX.Element {
  const url = `${SITE_ORIGIN}${href(`neighborhood.${neighborhood.slug}`, locale)}`;
  const faqNode = buildFaqPageNode(faqs, locale);
  const nodes = [
    placeNode(neighborhood, url, locale),
    webPageNode(
      neighborhood.name[locale],
      neighborhood.answer.answer[locale],
      url,
      locale,
      neighborhood.answer.updated
    ),
  ];
  if (faqNode) nodes.push(faqNode);

  // LeadCta attribution: the first related portal when one exists (a
  // neighborhood page is a portal-adjacent surface), else the general
  // contact preset — the home-view precedent.
  const portal = neighborhood.relatedPortalIds[0];

  return (
    <Section className="py-16 md:py-24">
      <div className="space-y-12">
        {neighborhood.isFixture === true ? (
          <aside
            className="border border-marine px-5 py-4"
            data-testid="fixture-banner"
          >
            <p className="font-mono text-xs uppercase tracking-wider text-marine">
              {t(UI.fixtureBanner.tag, locale)}
            </p>
            <p className="mt-1 max-w-prose font-sans text-sm text-ink">
              {t(UI.fixtureBanner.body, locale)}
            </p>
          </aside>
        ) : null}

        <Breadcrumbs
          items={[
            { id: 'home', label: UI.breadcrumb.home },
            { id: 'neighborhoods', label: UI.nav.neighborhoods },
            {
              id: `neighborhood.${neighborhood.slug}`,
              label: neighborhoodLabel(neighborhood),
            },
          ]}
          locale={locale}
        />
        <Heading level={1}>
          {isTK(neighborhood.answer.question) ? (
            <PlaceholderTK id={placeholderId(neighborhood.answer.question)} />
          ) : (
            t(neighborhood.answer.question, locale)
          )}
        </Heading>
        <AnswerBlock block={neighborhood.answer} locale={locale} />

        {neighborhood.stats ? (
          <StatGrid stats={neighborhood.stats} locale={locale} />
        ) : null}

        {isTK(neighborhood.overview) ? (
          <PlaceholderTK id={placeholderId(neighborhood.overview)} />
        ) : (
          <Prose>{t(neighborhood.overview, locale)}</Prose>
        )}

        {faqs.length > 0 ? (
          <section>
            <Heading level={2}>{t(UI.sections.faqHeading, locale)}</Heading>
            <div className="mt-4">
              <FaqSection items={faqs} locale={locale} />
            </div>
          </section>
        ) : null}

        {portal !== undefined ? (
          <LeadCta
            locale={locale}
            sourceType="portal_cta"
            portal={portal}
            intent={PORTAL_INTENT[portal]}
          />
        ) : (
          <LeadCta locale={locale} sourceType="contact" intent="general" />
        )}
      </div>
      <JsonLd graph={pageGraph(nodes)} />
    </Section>
  );
}
