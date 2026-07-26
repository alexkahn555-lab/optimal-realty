import { SITE_ORIGIN } from '@/config/origin';
import { UI } from '@/content/ui-strings';
import { t } from '@/lib/i18n';
import { href } from '@/lib/seo/href';
import { articleNode, pageGraph } from '@/lib/seo/jsonld';
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
  PortalSubpage,
  ToolDef,
} from '@/lib/types';

import { AdviceList } from './AdviceList';
import { LeadCta } from './LeadCta';
import { ToolRack } from './ToolRack';

/**
 * SUBPAGE TEMPLATE (RSC, zero JS) — the portal-child article page: Breadcrumbs
 * (home / portal / subpage), H1, AnswerBlock, AdviceList (null when empty),
 * related-tools rack, FaqSection, LeadCta, then Article + FAQPage JSON-LD via
 * the existing builders (author → #raul, publisher → #agent by @id reference).
 *
 * FAQ rule (Part 4.2): the caller resolves faqs from ids NOT already on the
 * portal hub — a question must appear in exactly one FAQPage node site-wide.
 */

export interface SubpageTemplateProps {
  subpage: PortalSubpage;
  /** Crumb parent; also the hub whose faqIds the caller de-duplicated against. */
  portal: Portal;
  /** Resolved from subpage.relatedToolIds — published tools only. */
  tools: ToolDef[];
  /** Resolved from subpage.adviceIds — published sections only (may be empty). */
  advice: AdviceSection[];
  /** TK-clean answers, ids not on the hub (caller enforces the dedup). */
  faqs: ResolvedFaq[];
  locale: Locale;
  /** Structural attribution for the CTA (e.g. 'valuation' on home-valuation). */
  leadIntent: LeadIntent;
}

export function SubpageTemplate({
  subpage,
  portal,
  tools,
  advice,
  faqs,
  locale,
  leadIntent,
}: SubpageTemplateProps): JSX.Element {
  const url = `${SITE_ORIGIN}${href(`subpage.${subpage.id}`, locale)}`;
  const faqNode = buildFaqPageNode(faqs, locale);
  const nodes = [articleNode(subpage, url, locale)];
  if (faqNode) nodes.push(faqNode);

  return (
    <Section className="py-16 md:py-24">
      <div className="space-y-12">
        <Breadcrumbs
          items={[
            { id: 'home', label: UI.breadcrumb.home },
            { id: `portal.${portal.id}`, label: portal.title },
            { id: `subpage.${subpage.id}`, label: subpage.title },
          ]}
          locale={locale}
        />
        <Heading level={1}>{t(subpage.answer.question, locale)}</Heading>
        <AnswerBlock block={subpage.answer} locale={locale} />

        <AdviceList advice={advice} locale={locale} />
        <ToolRack
          tools={tools}
          locale={locale}
          heading={UI.sections.relatedTools}
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
          intent={leadIntent}
        />
      </div>
      <JsonLd graph={pageGraph(nodes)} />
    </Section>
  );
}
