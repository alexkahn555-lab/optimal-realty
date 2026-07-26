import type { Listing, Locale } from '@/lib/types';

/**
 * Pure display helpers shared by the listing modules. Framework-free so the
 * privacy-degradation contract is unit-testable without rendering.
 */

/** Integer USD list price → localized currency, no cents (display only). */
export function formatPriceUsd(price: number, locale: Locale): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale).format(value);
}

/** Bath count for the mono rail: full + 0.5 × half (e.g. 3 + 1 half → 3.5). */
export function bathsTotal(listing: Listing): number {
  return listing.facts.bathsFull + listing.facts.bathsHalf * 0.5;
}

export interface DisplayAddress {
  /** Heading line: street (+ unit) when shown, city/zip form when withheld. */
  heading: string;
  /** Always-safe locality line: "City, FL zip". */
  cityLine: string;
  /** Whether the street line may be rendered anywhere. */
  full: boolean;
}

/**
 * THE privacy toggle (Part 2.3): when showFullAddress is false, no module,
 * card, breadcrumb, meta title, or JSON-LD node may carry line1/unit — the
 * listing surfaces ONLY through the city/zip form this helper returns.
 */
export function displayAddress(listing: Listing): DisplayAddress {
  const { line1, unit, city, state, zip } = listing.address;
  const cityLine = `${city}, ${state} ${zip}`;
  if (!listing.showFullAddress) {
    return { heading: cityLine, cityLine, full: false };
  }
  return {
    heading: unit === undefined ? line1 : `${line1} #${unit}`,
    cityLine,
    full: true,
  };
}
