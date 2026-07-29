import { UI } from '@/content/ui-strings';
import type { LegalPageDef } from '@/content/legal';
import { t } from '@/lib/i18n';
import { Breadcrumbs, PlaceholderTK } from '@/components/seo';
import { Heading, Prose, Section } from '@/components/primitives';
import type { Locale, Localized } from '@/lib/types';

/**
 * LEGAL TEMPLATE (RSC, zero JS — D5 skeleton). Title chrome + freshness line;
 * every body is attorney-authored and gated to a visible placeholder in
 * preview, nothing in production. No page-level JSON-LD: an all-placeholder
 * page is not an indexable surface (it is also excluded from the sitemap).
 */

export interface LegalTemplateProps {
  page: LegalPageDef;
  locale: Locale;
}

const TK = /\bTK_/;
const isTK = (value: Localized): boolean => TK.test(value.en) || TK.test(value.es);

export function LegalTemplate({ page, locale }: LegalTemplateProps): JSX.Element {
  const updated = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${page.updated}T00:00:00Z`));

  return (
    <Section className="py-16 md:py-24">
      <div className="space-y-8">
        <Breadcrumbs
          items={[
            { id: 'home', label: UI.breadcrumb.home },
            { id: `legal.${page.id}`, label: page.title },
          ]}
          locale={locale}
        />
        <Heading level={1}>{t(page.title, locale)}</Heading>
        <p className="font-mono text-xs uppercase tracking-wide text-marine">
          {`${t(UI.answer.updated, locale)} ${updated}`}
        </p>
        {isTK(page.body) ? (
          // Marker prefix stripped (the 4b convention, swept in 6a): the id
          // must never re-introduce a raw marker into the served document.
          <PlaceholderTK id={page.body.en.replace(TK, '')} />
        ) : (
          <Prose>{t(page.body, locale)}</Prose>
        )}
      </div>
    </Section>
  );
}
