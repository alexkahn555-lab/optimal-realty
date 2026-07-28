import { t } from '@/lib/i18n';
import type { Listing, Locale } from '@/lib/types';

import { LISTING_UI } from './strings';

/**
 * FIXTURE BANNER (4c) — visible truth labeling at the top of every fixture
 * listing page: this is a demonstration listing built from placeholder data,
 * not a real property, offer, or transaction. Renders null on real listings.
 * The copy is structural chrome (a factual statement about the page itself),
 * not broker counsel. Single-color, value-neutral (Part 1.4).
 */
export function FixtureBanner({
  listing,
  locale,
}: {
  listing: Listing;
  locale: Locale;
}): JSX.Element | null {
  if (listing.isFixture !== true) return null;

  return (
    <aside
      className="border border-marine px-5 py-4"
      data-testid="fixture-banner"
    >
      <p className="font-mono text-xs uppercase tracking-wider text-marine">
        {t(LISTING_UI.fixture.tag, locale)}
      </p>
      <p className="mt-1 max-w-prose font-sans text-sm text-ink">
        {t(LISTING_UI.fixture.body, locale)}
      </p>
    </aside>
  );
}
