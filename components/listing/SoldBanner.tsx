import { isSoldArchived } from '@/lib/content/loaders';
import { t } from '@/lib/i18n';
import type { Listing, Locale } from '@/lib/types';

import { formatPriceUsd } from './helpers';
import { LISTING_UI } from './strings';

/**
 * Closed-transaction banner (sold detail). Zero JS. States the closed date,
 * which side the brokerage represented, and — only when the data file
 * discloses it — the closed price. Facts from soldData only; nothing here is
 * prose. Renders null on non-archived listings (module contract).
 */
export function SoldBanner({
  listing,
  locale,
}: {
  listing: Listing;
  locale: Locale;
}): JSX.Element | null {
  if (!isSoldArchived(listing) || !listing.soldData) return null;

  const closedDate = listing.dates.sold
    ? new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(`${listing.dates.sold}T00:00:00Z`))
    : null;

  const represented = {
    seller: LISTING_UI.sold.representedSeller,
    buyer: LISTING_UI.sold.representedBuyer,
    both: LISTING_UI.sold.representedBoth,
  }[listing.soldData.represented];

  return (
    <aside className="bg-marine px-6 py-5 md:px-8">
      <p className="font-mono text-xs uppercase tracking-wider text-teal">
        {t(LISTING_UI.sold.bannerTag, locale)}
      </p>
      {closedDate ? (
        <p className="mt-1 font-sans text-sm text-bone">
          {`${t(LISTING_UI.sold.closedOn, locale)} ${closedDate}.`}
        </p>
      ) : null}
      <p className="mt-1 font-sans text-sm text-bone">{t(represented, locale)}</p>
      {listing.soldData.closedPrice !== undefined ? (
        <p className="mt-2 font-mono text-2xl tabular-nums text-bone">
          {`${formatPriceUsd(listing.soldData.closedPrice, locale)}`}
          <span className="ml-3 font-mono text-xs uppercase tracking-wider text-teal">
            {t(LISTING_UI.sold.closedPrice, locale)}
          </span>
        </p>
      ) : null}
    </aside>
  );
}
