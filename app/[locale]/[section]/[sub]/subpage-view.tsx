import type { LeadIntent, Locale, Portal, PortalSubpage } from '@/lib/types';
import { HOME_VALUATION_LEAD_INTENT } from '@/content/subpages/home-valuation';
import { SELLING_PROCESS_LEAD_INTENT } from '@/content/subpages/selling-process';
import {
  ALL_FAQS,
  publishedTools,
  resolvedFaqs,
} from '@/lib/content/loaders';
import { PORTAL_INTENT, SubpageTemplate } from '@/components/portal';

/**
 * SUBPAGE VIEW — dynamically imported by the [sub] router so the LeadForm
 * client chunk (via SubpageTemplate → LeadCta) is scoped to subpage URLs and
 * never rides into legal documents, which share the same page module and must
 * ship zero client JS (Part 8). Keep this module out of the router's static
 * import graph.
 */

/** Structural CTA intent per subpage; falls back to the portal's intent. */
const SUBPAGE_INTENT: Record<string, LeadIntent> = {
  'sellers-home-valuation': HOME_VALUATION_LEAD_INTENT,
  'sellers-selling-process': SELLING_PROCESS_LEAD_INTENT,
};

export function SubpageView({
  subpage,
  portal,
  locale,
}: {
  subpage: PortalSubpage;
  portal: Portal;
  locale: Locale;
}): JSX.Element {
  const tools = publishedTools().filter((tool) =>
    subpage.relatedToolIds.includes(tool.id)
  );
  // FAQPage rule (Part 4.2): only ids NOT already on the portal hub.
  const faqs = resolvedFaqs(
    ALL_FAQS,
    subpage.faqIds.filter((id) => !portal.faqIds.includes(id))
  );

  return (
    <SubpageTemplate
      subpage={subpage}
      portal={portal}
      tools={tools}
      advice={[]} // no AdviceSections exist yet — AdviceList renders null
      faqs={faqs}
      locale={locale}
      leadIntent={SUBPAGE_INTENT[subpage.id] ?? PORTAL_INTENT[portal.id]}
    />
  );
}
