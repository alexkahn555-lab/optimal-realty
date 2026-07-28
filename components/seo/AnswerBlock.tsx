import { t } from '@/lib/i18n';
import type { AnswerBlock as AnswerBlockData, Locale, Localized } from '@/lib/types';
import { UI } from '@/content/ui-strings';
import { PlaceholderTK } from './PlaceholderTK';

export interface AnswerBlockProps {
  block: AnswerBlockData;
  locale: Locale;
}

const TK = /\bTK_/;
const isTK = (value: Localized): boolean => TK.test(value.en) || TK.test(value.es);

/**
 * An unfilled answer (publishable in report mode since 5b) ships VISIBLY as
 * PlaceholderTK. The id is the marker from whichever locale carries it, with
 * the marker prefix dropped (the 4b PlaceholderTK convention) so the served
 * document never contains a raw placeholder marker string.
 */
function placeholderId(value: Localized): string {
  return (TK.test(value.en) ? value.en : value.es).replace(TK, '');
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
      {isTK(block.answer) ? (
        <p className="max-w-prose">
          <PlaceholderTK id={placeholderId(block.answer)} />
        </p>
      ) : (
        <p className="max-w-prose font-display text-xl leading-relaxed text-ink md:text-2xl">
          {t(block.answer, locale)}
        </p>
      )}
      <p className="mt-3 font-mono text-xs uppercase tracking-wide text-marine">
        {`${t(UI.answer.updated, locale)} ${formattedUpdated}`}
      </p>
    </>
  );
}
