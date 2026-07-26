import type { Locale, Portal } from '@/lib/types';
import { ALL_FAQS, publishedTools, resolvedFaqs } from '@/lib/content/loaders';
import { PortalTemplate } from '@/components/portal';

/**
 * PORTAL HUB VIEW — dynamically imported by the [section] router so the
 * LeadForm client chunk (via PortalTemplate → LeadCta) is scoped to portal
 * hub URLs and never rides into form-less hubs (tools, about), which share
 * the same page module and must ship zero client JS (Part 8). Keep this
 * module out of the router's static import graph.
 */

export function PortalView({
  portal,
  locale,
}: {
  portal: Portal;
  locale: Locale;
}): JSX.Element {
  const tools = publishedTools().filter((tool) => portal.toolIds.includes(tool.id));
  const faqs = resolvedFaqs(ALL_FAQS, portal.faqIds);

  return (
    <PortalTemplate
      portal={portal}
      tools={tools}
      advice={[]} // no AdviceSections exist yet — AdviceList renders null
      faqs={faqs}
      locale={locale}
    />
  );
}
