import { t } from '@/lib/i18n';
import type { Locale, Localized } from '@/lib/types';

export interface ResolvedFaq {
  question: Localized;
  answer: Localized;
}

export interface FaqSectionProps {
  items: ResolvedFaq[];
  locale: Locale;
}

export function FaqSection({ items, locale }: FaqSectionProps): JSX.Element | null {
  if (items.length === 0) return null;

  return (
    <>
      {items.slice(0, 8).map((item, index) => (
        <details key={index} className="border-b border-hair py-3">
          <summary className="cursor-pointer font-sans text-ink">
            {t(item.question, locale)}
          </summary>
          <div className="mt-2 max-w-prose font-sans leading-relaxed text-ink">
            {t(item.answer, locale)}
          </div>
        </details>
      ))}
    </>
  );
}

export function buildFaqPageNode(
  items: ResolvedFaq[],
  locale: Locale
): Record<string, unknown> | null {
  if (items.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.slice(0, 8).map((item) => ({
      '@type': 'Question',
      name: t(item.question, locale),
      acceptedAnswer: {
        '@type': 'Answer',
        text: t(item.answer, locale),
      },
    })),
  };
}
