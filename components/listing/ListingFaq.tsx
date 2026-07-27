import { ALL_FAQS, resolvedFaqs } from '@/lib/content/loaders';
import { t } from '@/lib/i18n';
import { UI } from '@/content/ui-strings';
import type { Faq, Listing, Locale } from '@/lib/types';
import { Heading } from '@/components/primitives';
import { buildFaqPageNode, FaqSection, JsonLd } from '@/components/seo';

/**
 * M13 — listing FAQ. Zero JS (native <details> via FaqSection). Resolves the
 * listing's faqIds against the site pool; only TK-clean answers render
 * (answers are broker-authored — an unanswered FAQ simply does not exist
 * here). Renders null when nothing resolves. The FAQPage node is emitted HERE
 * for listing-scoped ids only — listing ids never appear on portal/tool pages
 * (id-uniqueness is enforced by the site-wide FAQ test), so no id is ever
 * emitted twice.
 */
export function ListingFaq({
  listing,
  locale,
  pool = ALL_FAQS,
}: {
  listing: Listing;
  locale: Locale;
  /** Injectable for tests; production always uses the site pool. */
  pool?: readonly Faq[];
}): JSX.Element | null {
  const faqs = resolvedFaqs(pool, listing.faqIds ?? []);
  if (faqs.length === 0) return null;

  const node = buildFaqPageNode(faqs, locale);

  return (
    <section>
      <Heading level={2}>{t(UI.sections.faqHeading, locale)}</Heading>
      <div className="mt-4">
        <FaqSection items={faqs} locale={locale} />
      </div>
      {node ? <JsonLd graph={node} /> : null}
    </section>
  );
}
