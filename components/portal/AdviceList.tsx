import { UI } from '@/content/ui-strings';
import { t } from '@/lib/i18n';
import { PlaceholderTK } from '@/components/seo';
import { Heading, Prose } from '@/components/primitives';
import type { AdviceSection, Locale, Localized } from '@/lib/types';

/**
 * ADVICE LIST (Part 7.2 slot 5) — broker counsel sections. Renders NULL when
 * nothing is published: client copy never blocks a route (the build-unblocking
 * rule). A published section whose body still carries a marker renders a
 * visible placeholder in preview and nothing in production — never the marker
 * text. "Reviewed <date>" is the authorship + freshness signal.
 */

export interface AdviceListProps {
  advice: AdviceSection[];
  locale: Locale;
}

const TK = /\bTK_/;
const isTK = (value: Localized): boolean => TK.test(value.en) || TK.test(value.es);

export function AdviceList({ advice, locale }: AdviceListProps): JSX.Element | null {
  const published = advice.filter((section) => section.status === 'published');
  if (published.length === 0) return null;

  return (
    <section>
      <Heading level={2}>{t(UI.sections.adviceHeading, locale)}</Heading>
      {published.map((section) => (
        <div key={section.id} className="border-b border-hair py-6">
          <Heading level={3}>{t(section.heading, locale)}</Heading>
          <div className="mt-3">
            {isTK(section.body) ? (
              // Marker prefix stripped (the 4b convention, swept in 6a): the
              // id must never re-introduce a raw marker into the document.
              <PlaceholderTK id={section.body.en.replace(TK, '')} />
            ) : (
              <Prose>{t(section.body, locale)}</Prose>
            )}
          </div>
          {section.lastReviewed ? (
            <p className="mt-3 font-mono text-xs uppercase tracking-wide text-marine">
              {`${t(UI.sections.reviewedLabel, locale)} ${new Intl.DateTimeFormat(
                locale,
                { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }
              ).format(new Date(`${section.lastReviewed}T00:00:00Z`))}`}
            </p>
          ) : null}
        </div>
      ))}
    </section>
  );
}
