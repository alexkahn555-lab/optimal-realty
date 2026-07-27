import { t } from '@/lib/i18n';
import type { Listing, Locale } from '@/lib/types';
import { Heading } from '@/components/primitives';

import { LISTING_UI } from './strings';

/**
 * M9 — feature groups. Zero JS. Structural amenity labels from the data file,
 * grouped; renders null when the listing carries none (degrade by omission).
 */
export function FeatureGroups({
  listing,
  locale,
}: {
  listing: Listing;
  locale: Locale;
}): JSX.Element | null {
  const groups = listing.featureGroups.filter((group) => group.items.length > 0);
  if (groups.length === 0) return null;

  return (
    <section>
      <Heading level={2}>{t(LISTING_UI.features.heading, locale)}</Heading>
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        {groups.map((group) => (
          <div key={t(group.group, 'en')}>
            <h3 className="font-mono text-xs uppercase tracking-wider text-marine">
              {t(group.group, locale)}
            </h3>
            <ul className="mt-2">
              {group.items.map((item) => (
                <li
                  key={t(item, 'en')}
                  className="border-b border-hair py-2 font-sans text-sm text-ink"
                >
                  {t(item, locale)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
