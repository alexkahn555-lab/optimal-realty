import { t } from '@/lib/i18n';
import type { AnswerBlock as AnswerBlockData, Locale } from '@/lib/types';
import { UI } from '@/content/ui-strings';

export interface AnswerBlockProps {
  block: AnswerBlockData;
  locale: Locale;
}

export function AnswerBlock({ block, locale }: AnswerBlockProps): JSX.Element {
  const formattedUpdated = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${block.updated}T00:00:00Z`));

  return (
    <>
      <p className="max-w-prose font-display text-xl leading-relaxed text-ink md:text-2xl">
        {t(block.answer, locale)}
      </p>
      <p className="mt-3 font-mono text-xs uppercase tracking-wide text-marine">
        {`${t(UI.answer.updated, locale)} ${formattedUpdated}`}
      </p>
    </>
  );
}
