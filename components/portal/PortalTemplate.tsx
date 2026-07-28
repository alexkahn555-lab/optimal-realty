import { SITE_ORIGIN } from '@/config/origin';
import { UI } from '@/content/ui-strings';
import { portalLabel } from '@/lib/content/loaders';
import { t } from '@/lib/i18n';
import { href } from '@/lib/seo/href';
import { pageGraph, serviceNode, webPageNode } from '@/lib/seo/jsonld';
import {
  AnswerBlock,
  Breadcrumbs,
  FaqSection,
  JsonLd,
  PlaceholderTK,
  buildFaqPageNode,
  type ResolvedFaq,
} from '@/components/seo';
import { Heading, Section } from '@/components/primitives';
import type {
  AdviceSection,
  LeadIntent,
  Locale,
  Localized,
  Portal,
  PortalId,
  ToolDef,
} from '@/lib/types';

import { AdviceList } from './AdviceList';
import { DecisionPath } from './DecisionPath';
import { LeadCta } from './LeadCta';
import { RelatedListings } from './RelatedListings';
import { ToolRack } from './ToolRack';

/**
 * PORTAL TEMPLATE (RSC, zero JS) — the ten ordered slots of Part 7.2:
 *   1 Breadcrumbs · 2 H1 (answer.question) · 3 AnswerBlock · 4 ToolRack ·
 *   5 AdviceList (null when empty — client copy never blocks a route) ·
 *   6 DecisionPath · 7 RelatedListings (null until listings exist) ·
 *   8 FaqSection (max 8, TK-clean only) · 9 LeadCta → LeadForm ·
 *   10 JsonLd (Service + WebPage, plus FAQPage when FAQs exist, via the
 *     existing builders; BreadcrumbList is emitted by the Breadcrumbs
 *     component). Every node references #agent by @id — serviceNode does
 *     this; nothing here redeclares the entity.
 *
 * 5c: an unfilled QUESTION publishes in report mode (Part 3.2), so the H1
 * renders through PlaceholderTK exactly like the AnswerBlock's answer, and
 * the breadcrumb label degrades via portalLabel — a raw marker never serves.
 */

const TK = /\bTK_/;
const isTK = (value: Localized): boolean => TK.test(value.en) || TK.test(value.es);

/** Marker id for PlaceholderTK, prefix dropped (the 4b convention). */
function placeholderId(value: Localized): string {
  return (TK.test(value.en) ? value.en : value.es).replace(TK, '');
}

/** Lead intent per portal — structural attribution wiring for slot 9. */
export const PORTAL_INTENT: Record<PortalId, LeadIntent> = {
  sellers: 'sell',
  buyers: 'buy',
  investors: 'invest',
  landlords: 'lease-out',
  tenants: 'rent',
};

export interface PortalTemplateProps {
  portal: Portal;
  /** Resolved from portal.toolIds — published tools only. */
  tools: ToolDef[];
  /** Resolved from portal.adviceIds — published sections only (may be empty). */
  advice: AdviceSection[];
  /** Resolved from portal.faqIds — TK-clean answers only. */
  faqs: ResolvedFaq[];
  locale: Locale;
}

export function PortalTemplate({
  portal,
  tools,
  advice,
  faqs,
  locale,
}: PortalTemplateProps): JSX.Element {
  const url = `${SITE_ORIGIN}${href(`portal.${portal.id}`, locale)}`;
  const faqNode = buildFaqPageNode(faqs, locale);
  const nodes = [
    serviceNode(portal, url, locale),
    // Part 4.2: the hub also emits a WebPage. Unfilled name/description are
    // stripped by pageGraph, never served.
    webPageNode(
      portal.title[locale],
      portal.answer.answer[locale],
      url,
      locale,
      portal.answer.updated
    ),
  ];
  if (faqNode) nodes.push(faqNode);

  return (
    <Section className="py-16 md:py-24">
      <div className="space-y-12">
        <Breadcrumbs
          items={[
            { id: 'home', label: UI.breadcrumb.home },
            { id: `portal.${portal.id}`, label: portalLabel(portal) },
          ]}
          locale={locale}
        />
        <Heading level={1}>
          {isTK(portal.answer.question) ? (
            <PlaceholderTK id={placeholderId(portal.answer.question)} />
          ) : (
            t(portal.answer.question, locale)
          )}
        </Heading>
        <AnswerBlock block={portal.answer} locale={locale} />

        <ToolRack tools={tools} locale={locale} heading={UI.sections.toolRack} />
        <AdviceList advice={advice} locale={locale} />
        <DecisionPath
          steps={portal.decisionSteps}
          decision={portal.decision}
          locale={locale}
        />
        <RelatedListings
          mode={portal.featuredListings.mode}
          limit={portal.featuredListings.limit}
          locale={locale}
        />

        {faqs.length > 0 ? (
          <section>
            <Heading level={2}>{t(UI.sections.faqHeading, locale)}</Heading>
            <div className="mt-4">
              <FaqSection items={faqs} locale={locale} />
            </div>
          </section>
        ) : null}

        <LeadCta
          locale={locale}
          sourceType="portal_cta"
          portal={portal.id}
          intent={PORTAL_INTENT[portal.id]}
        />
      </div>
      <JsonLd graph={pageGraph(nodes)} />
    </Section>
  );
}
