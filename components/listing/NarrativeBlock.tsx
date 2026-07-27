import { localizedClean } from '@/lib/content/loaders';
import { t } from '@/lib/i18n';
import type { Listing, Locale } from '@/lib/types';
import { Heading, Prose } from '@/components/primitives';
import { PlaceholderTK } from '@/components/seo/PlaceholderTK';

import { LISTING_UI } from './strings';

/**
 * M12 — narrative + highlights. The narrative is BROKER-AUTHORED prose and is
 * never generated here: while it carries a TK marker the report shows a
 * visible PlaceholderTK (preview is the discovery instrument), and under
 * CONTENT_STRICT the whole block vanishes rather than ship a placeholder.
 * Highlights render only the TK-clean bullets.
 */
export function NarrativeBlock({
  listing,
  locale,
}: {
  listing: Listing;
  locale: Locale;
}): JSX.Element | null {
  const narrativeClean = localizedClean(listing.narrative);
  const highlights = listing.highlights.filter(localizedClean);
  const strict = process.env.CONTENT_STRICT === '1';

  if (!narrativeClean && highlights.length === 0 && strict) return null;
  if (!narrativeClean && highlights.length === 0 && !strict) {
    return (
      <section>
        <Heading level={2}>{t(LISTING_UI.narrative.heading, locale)}</Heading>
        <div className="mt-4">
          <PlaceholderTK id={`${listing.id}_NARRATIVE`} />
        </div>
      </section>
    );
  }

  return (
    <section>
      <Heading level={2}>{t(LISTING_UI.narrative.heading, locale)}</Heading>
      {narrativeClean ? (
        <div className="mt-4">
          <Prose>
            {t(listing.narrative, locale)
              .split('\n\n')
              .map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}
          </Prose>
        </div>
      ) : !strict ? (
        <div className="mt-4">
          <PlaceholderTK id={`${listing.id}_NARRATIVE`} />
        </div>
      ) : null}
      {highlights.length > 0 ? (
        <div className="mt-6">
          <h3 className="font-mono text-xs uppercase tracking-wider text-marine">
            {t(LISTING_UI.narrative.highlights, locale)}
          </h3>
          <ul className="mt-2">
            {highlights.map((highlight) => (
              <li
                key={t(highlight, 'en')}
                className="border-b border-hair py-2 font-sans text-sm text-ink"
              >
                {t(highlight, locale)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
