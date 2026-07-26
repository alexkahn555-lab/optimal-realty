import { SITE_ORIGIN } from '@/config/origin';
import { UI } from '@/content/ui-strings';
import { t } from '@/lib/i18n';
import { href } from '@/lib/seo/href';
import { pageGraph, serviceNode } from '@/lib/seo/jsonld';
import {
  AnswerBlock,
  Breadcrumbs,
  FaqSection,
  JsonLd,
  buildFaqPageNode,
  type ResolvedFaq,
} from '@/components/seo';
import { Heading, Section } from '@/components/primitives';
import type {
  AdviceSection,
  LeadIntent,
  Locale,
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
 *   10 JsonLd (Service + FAQPage via the existing builders; BreadcrumbList is
 *     emitted by the Breadcrumbs component). Every node references #agent by
 *     @id — serviceNode does this; nothing here redeclares the entity.
 */

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
  const nodes = [serviceNode(portal, url, locale)];
  if (faqNode) nodes.push(faqNode);

  return (
    <Section className="py-16 md:py-24">
      <div className="space-y-12">
        <Breadcrumbs
          items={[
            { id: 'home', label: UI.breadcrumb.home },
            { id: `portal.${portal.id}`, label: portal.title },
          ]}
          locale={locale}
        />
        <Heading level={1}>{t(portal.answer.question, locale)}</Heading>
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
