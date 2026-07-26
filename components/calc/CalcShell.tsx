import type { ReactNode } from 'react';

import { UI } from '@/content/ui-strings';
import { t } from '@/lib/i18n';
import { pageGraph, webApplicationNode } from '@/lib/seo/jsonld';
import { SITE_ORIGIN } from '@/config/origin';
import { href } from '@/lib/seo/href';
import {
  AnswerBlock,
  Breadcrumbs,
  FaqSection,
  JsonLd,
  PlaceholderTK,
  buildFaqPageNode,
  type Crumb,
  type ResolvedFaq,
} from '@/components/seo';
import { Heading, Prose, Section } from '@/components/primitives';
import type { Locale, Localized, ToolDef } from '@/lib/types';

/**
 * CALCULATOR SHELL (RSC, zero JS — Part 7.4). Server-rendered frame around the
 * island: breadcrumbs, question H1, answer block, then the children (island +
 * assumptions table), method note, disclaimer, FAQ, and the WebApplication +
 * FAQPage graph. Method note and disclaimer are licensed/attorney prose —
 * TK until supplied, rendered as a visible PlaceholderTK in preview and
 * nothing in production.
 */

export interface CalcShellProps {
  tool: ToolDef;
  locale: Locale;
  crumbs: Crumb[];
  /** Resolved FAQs, pre-filtered to TK-clean answers by the caller. */
  faqs: ResolvedFaq[];
  children: ReactNode;
}

const TK = /\bTK_/;
const isTK = (value: Localized): boolean => TK.test(value.en) || TK.test(value.es);

function GatedProse({
  value,
  locale,
}: {
  value: Localized;
  locale: Locale;
}): JSX.Element {
  if (isTK(value)) return <PlaceholderTK id={value.en} />;
  return <Prose>{t(value, locale)}</Prose>;
}

export function CalcShell({
  tool,
  locale,
  crumbs,
  faqs,
  children,
}: CalcShellProps): JSX.Element {
  const url = `${SITE_ORIGIN}${href(`tool.${tool.id}`, locale)}`;
  const faqNode = buildFaqPageNode(faqs, locale);
  const nodes = [webApplicationNode(tool, url, locale)];
  if (faqNode) nodes.push(faqNode);

  return (
    <Section className="py-16 md:py-24">
      <div className="space-y-10">
        <Breadcrumbs items={crumbs} locale={locale} />
        <Heading level={1}>{t(tool.answer.question, locale)}</Heading>
        <AnswerBlock block={tool.answer} locale={locale} />

        {children}

        <section>
          <Heading level={2}>{t(UI.calc.methodHeading, locale)}</Heading>
          <div className="mt-4">
            <GatedProse value={tool.methodNote} locale={locale} />
          </div>
        </section>

        <section>
          <Heading level={2}>{t(UI.calc.disclaimerHeading, locale)}</Heading>
          <div className="mt-4">
            <GatedProse value={tool.disclaimer} locale={locale} />
          </div>
        </section>

        {faqs.length > 0 ? (
          <section>
            <Heading level={2}>{t(UI.sections.faqHeading, locale)}</Heading>
            <div className="mt-4">
              <FaqSection items={faqs} locale={locale} />
            </div>
          </section>
        ) : null}
      </div>
      <JsonLd graph={pageGraph(nodes)} />
    </Section>
  );
}
