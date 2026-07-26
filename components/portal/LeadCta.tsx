import { UI } from '@/content/ui-strings';
import { t } from '@/lib/i18n';
import { LeadForm } from '@/components/forms';
import { Hairline, Heading } from '@/components/primitives';
import type { LeadIntent, LeadSourceType, Locale, PortalId } from '@/lib/types';

/**
 * LEAD CTA (Part 7.2 slot 9) — the portal/subpage close: hairline, heading,
 * LeadForm island with the caller's attribution. Attribution props are spread
 * conditionally so the wire format never carries explicit undefineds (mirrors
 * LeadForm's own body construction).
 */

export interface LeadCtaProps {
  locale: Locale;
  sourceType: LeadSourceType;
  portal?: PortalId;
  sourceSlug?: string;
  intent: LeadIntent;
}

export function LeadCta({
  locale,
  sourceType,
  portal,
  sourceSlug,
  intent,
}: LeadCtaProps): JSX.Element {
  return (
    <section>
      <Hairline />
      <Heading level={2} className="mt-10">
        {t(UI.sections.leadCtaHeading, locale)}
      </Heading>
      <div className="mt-6 max-w-xl">
        <LeadForm
          locale={locale}
          sourceType={sourceType}
          intent={intent}
          {...(portal === undefined ? {} : { portal })}
          {...(sourceSlug === undefined ? {} : { sourceSlug })}
        />
      </div>
    </section>
  );
}
