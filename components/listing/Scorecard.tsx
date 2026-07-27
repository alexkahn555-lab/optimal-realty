import { localizedClean } from '@/lib/content/loaders';
import { t } from '@/lib/i18n';
import type { Listing, Locale } from '@/lib/types';
import { Heading } from '@/components/primitives';

import { LISTING_UI } from './strings';

/**
 * M7 — the broker's scorecard. Zero JS. SINGLE-COLOR bars (Part 1.4 hard
 * rule): the category label carries the meaning, the color never does — every
 * bar is the same teal fill regardless of score or category. The key union in
 * lib/types.ts has NO schools/desirability entry (unrepresentable, R-04); the
 * label table below is keyed off that union, so adding one would not compile.
 * Scores render (the broker's own structural assessment); per-entry NOTES are
 * broker prose and render only once TK-clean.
 */
export function Scorecard({
  listing,
  locale,
}: {
  listing: Listing;
  locale: Locale;
}): JSX.Element | null {
  const entries = listing.scorecard ?? [];
  if (entries.length === 0) return null;

  return (
    <section>
      <Heading level={2}>{t(LISTING_UI.scorecard.heading, locale)}</Heading>
      <dl className="mt-6 space-y-4">
        {entries.map((entry) => (
          <div key={entry.key}>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="font-mono text-xs uppercase tracking-wider text-marine">
                {t(LISTING_UI.scorecard[entry.key], locale)}
              </dt>
              <dd className="font-mono text-sm tabular-nums text-ink">
                {`${entry.score} / 5`}
              </dd>
            </div>
            {/* Same fill for every bar — length is the datum, color is not. */}
            <div className="mt-1 h-2 w-full border border-hair" aria-hidden="true">
              <div
                className="h-full bg-teal"
                style={{ width: `${entry.score * 20}%` }}
              />
            </div>
            {localizedClean(entry.note) ? (
              <p className="mt-1 max-w-prose font-sans text-sm text-ink">
                {t(entry.note, locale)}
              </p>
            ) : null}
          </div>
        ))}
      </dl>
      <p className="mt-4 max-w-prose font-sans text-xs text-marine">
        {t(LISTING_UI.scorecard.scaleNote, locale)}
      </p>
    </section>
  );
}
