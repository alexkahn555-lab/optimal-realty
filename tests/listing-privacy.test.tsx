import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LISTING_L_2026_001 } from '@/content/listings/l-2026-001';
import { LISTING_L_2026_002 } from '@/content/listings/l-2026-002';
import {
  listingPostalAddressNode,
  pageGraph,
  realEstateListingNode,
} from '@/lib/seo/jsonld';
import { displayAddress } from '@/components/listing/helpers';
import { IdentityHeader } from '@/components/listing/IdentityHeader';
import { ListingBreadcrumbs } from '@/components/listing/ListingBreadcrumbs';
import { ListingCard } from '@/components/listing/ListingCard';

/**
 * THE PRIVACY TOGGLE (D5): showFullAddress=false degrades EVERY surface —
 * report DOM (identity header), cards, breadcrumbs, and the JSON-LD
 * PostalAddress — to the city/zip form, and withholds GeoCoordinates. The
 * street line and unit must appear nowhere.
 */

const OPEN = LISTING_L_2026_001; // showFullAddress: true
const PRIVATE = LISTING_L_2026_002; // showFullAddress: false
const STREET = PRIVATE.address.line1; // '200 Placeholder Way'
const UNIT = PRIVATE.address.unit as string; // '1204'

describe('displayAddress', () => {
  it('full: street heading (with unit) + locality line', () => {
    expect(displayAddress(OPEN)).toEqual({
      heading: '100 Fixture Boulevard',
      cityLine: 'Coral Gables, FL 33134',
      full: true,
    });
  });

  it('degraded: heading IS the locality line; street never surfaces', () => {
    const address = displayAddress(PRIVATE);
    expect(address).toEqual({
      heading: 'Miami, FL 33131',
      cityLine: 'Miami, FL 33131',
      full: false,
    });
  });
});

describe('report DOM degradation', () => {
  it('IdentityHeader shows the street only when showFullAddress', () => {
    const open = renderToStaticMarkup(
      <IdentityHeader listing={OPEN} locale="en" />
    );
    expect(open).toContain('100 Fixture Boulevard');
    expect(open).toContain('Coral Gables, FL 33134');

    const closed = renderToStaticMarkup(
      <IdentityHeader listing={PRIVATE} locale="en" />
    );
    expect(closed).not.toContain(STREET);
    expect(closed).not.toContain(UNIT);
    expect(closed).toContain('Miami, FL 33131');
  });

  it('ListingCard and ListingBreadcrumbs degrade the same way', () => {
    for (const markup of [
      renderToStaticMarkup(<ListingCard listing={PRIVATE} locale="en" />),
      renderToStaticMarkup(<ListingBreadcrumbs listing={PRIVATE} locale="es" />),
    ]) {
      expect(markup).not.toContain(STREET);
      expect(markup).not.toContain(UNIT);
      expect(markup).toContain('Miami, FL 33131');
    }
  });
});

describe('JSON-LD degradation', () => {
  it('PostalAddress carries streetAddress only when showFullAddress', () => {
    expect(listingPostalAddressNode(OPEN)).toHaveProperty(
      'streetAddress',
      '100 Fixture Boulevard'
    );
    const degraded = listingPostalAddressNode(PRIVATE);
    expect(degraded).not.toHaveProperty('streetAddress');
    expect(degraded).toMatchObject({
      addressLocality: 'Miami',
      addressRegion: 'FL',
      postalCode: '33131',
    });
  });

  it('GeoCoordinates are withheld with the address', () => {
    const url = 'https://optimal-realty.vercel.app/en/listings/x';
    const openNode = realEstateListingNode(OPEN, url, 'en') as {
      about: Record<string, unknown>;
    };
    expect(openNode.about.geo).toMatchObject({ '@type': 'GeoCoordinates' });

    const closedNode = realEstateListingNode(PRIVATE, url, 'en') as {
      about: Record<string, unknown>;
    };
    expect(closedNode.about.geo).toBeUndefined();
  });

  it('the serialized page graph for the private listing has no street token', () => {
    const url = 'https://optimal-realty.vercel.app/en/listings/x';
    const json = JSON.stringify(
      pageGraph([realEstateListingNode(PRIVATE, url, 'en')])
    );
    expect(json).not.toContain(STREET);
    expect(json).not.toContain(`#${UNIT}`);
  });
});
