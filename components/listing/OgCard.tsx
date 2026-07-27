import type { Listing } from '@/lib/types';
import tailwindConfig from '@/tailwind.config';

import { bathsTotal, displayAddress } from './helpers';

/**
 * OG CARD (D3) — the share image for listing routes, rendered at build by
 * next/og (satori). It is a BRANDED TYPOGRAPHIC CARD built from the listing's
 * structured data (address per the privacy flag, price, beds/baths/sqft) —
 * never a fabricated property photo: an invented image shared as "the
 * property" would violate the no-AI-image-as-real-property rule, so no
 * imagery appears at all.
 *
 * Satori supports a flexbox subset with INLINE STYLES only (no Tailwind
 * classes); color values are read from tailwind.config.ts so the palette
 * still lives in exactly one place (raw hex stays banned here). Labels are
 * EN: the OG URL is locale-invariant and the card's text is figures + brand.
 */

const palette = (
  (tailwindConfig.theme?.extend?.colors ?? {}) as Record<string, string>
);
const BONE = palette.bone ?? 'rgb(242, 239, 232)';
const INK = palette.ink ?? 'rgb(21, 24, 27)';
const MARINE = palette.marine ?? 'rgb(14, 46, 54)';
const TEAL = palette.teal ?? 'rgb(0, 167, 154)';

const mono = { fontFamily: 'monospace' } as const;

export function ogCard(listing: Listing): JSX.Element {
  const address = displayAddress(listing);
  const sold = listing.status === 'sold' || listing.status === 'leased';
  const price = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(listing.price);
  const facts = [
    `${listing.facts.beds} bd`,
    `${new Intl.NumberFormat('en-US').format(bathsTotal(listing))} ba`,
    `${new Intl.NumberFormat('en-US').format(listing.facts.sqft)} sq ft`,
  ].join(' · ');

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: BONE,
        padding: 64,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div
          style={{
            ...mono,
            fontSize: 28,
            letterSpacing: 6,
            color: MARINE,
          }}
        >
          OPTIMAL REALTY
        </div>
        <div
          style={{
            ...mono,
            fontSize: 28,
            letterSpacing: 6,
            color: sold ? MARINE : TEAL,
          }}
        >
          {sold ? 'SOLD' : 'FOR SALE'}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 64, color: INK, lineHeight: 1.1 }}>
          {address.heading}
        </div>
        {address.full ? (
          <div style={{ fontSize: 36, color: MARINE, marginTop: 12 }}>
            {address.cityLine}
          </div>
        ) : null}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', height: 4, width: 220, backgroundColor: TEAL }} />
        <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 20 }}>
          {sold ? null : (
            <div style={{ ...mono, fontSize: 56, color: INK, marginRight: 40 }}>
              {price}
            </div>
          )}
          <div style={{ ...mono, fontSize: 32, color: MARINE, letterSpacing: 2 }}>
            {facts}
          </div>
        </div>
      </div>
    </div>
  );
}
