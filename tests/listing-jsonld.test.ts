import { describe, expect, it } from 'vitest';
import { LISTING_L_2026_001 } from '@/content/listings/l-2026-001';
import { LISTING_L_2026_002 } from '@/content/listings/l-2026-002';
import {
  itemListNode,
  pageGraph,
  realEstateListingNode,
} from '@/lib/seo/jsonld';

/**
 * D4 — RealEstateListing / ItemList builders: valid node shapes, the dwelling
 * subtype follows the property class, the Offer is InStock, images carry
 * intrinsic dimensions, and EVERY node references #agent by @id without ever
 * redeclaring the entity.
 */

const ORIGIN = 'https://optimal-realty.vercel.app';
const URL_1 = `${ORIGIN}/en/listings/${LISTING_L_2026_001.slug}`;

describe('realEstateListingNode', () => {
  const node = realEstateListingNode(LISTING_L_2026_001, URL_1, 'en') as Record<
    string,
    Record<string, unknown> & { '@id'?: string }
  > &
    Record<string, unknown>;

  it('is a RealEstateListing about the dwelling subtype for its class', () => {
    expect(node['@type']).toBe('RealEstateListing');
    expect(node['@id']).toBe(`${URL_1}#listing`);
    expect((node.about as Record<string, unknown>)['@type']).toBe(
      'SingleFamilyResidence'
    );
    const condo = realEstateListingNode(LISTING_L_2026_002, URL_1, 'en') as {
      about: Record<string, unknown>;
    };
    expect(condo.about['@type']).toBe('Apartment');
  });

  it('offers InStock at the integer list price in USD, offered by #agent', () => {
    expect(node.offers).toMatchObject({
      '@type': 'Offer',
      price: 1_285_000,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      offeredBy: { '@id': `${ORIGIN}/#agent` },
    });
  });

  it('references #agent as provider and never redeclares the entity', () => {
    expect(node.provider).toEqual({ '@id': `${ORIGIN}/#agent` });
    const json = JSON.stringify(pageGraph([node]));
    expect(json).toContain(`${ORIGIN}/#agent`);
    expect(json).not.toContain('"@type":"RealEstateAgent"');
  });

  it('emits ImageObject[] with absolute URLs and intrinsic dimensions', () => {
    const images = node.image as unknown as Record<string, unknown>[];
    expect(images).toHaveLength(LISTING_L_2026_001.media.length);
    for (const [index, image] of images.entries()) {
      const asset = LISTING_L_2026_001.media[index]!;
      expect(image).toMatchObject({
        '@type': 'ImageObject',
        contentUrl: `${ORIGIN}${asset.src}`,
        width: asset.w,
        height: asset.h,
      });
      expect(String(image.caption).toLowerCase()).toContain('placeholder');
    }
  });

  it('carries dwelling facts and the listing dates', () => {
    expect(node.about).toMatchObject({
      numberOfBedrooms: 4,
      numberOfFullBathrooms: 3,
      numberOfPartialBathrooms: 1,
      yearBuilt: 1998,
      floorSize: { '@type': 'QuantitativeValue', value: 2640, unitCode: 'FTK' },
    });
    expect(node.datePosted).toBe('2026-06-18');
    expect(node.inLanguage).toBe('en');
  });

  it('survives the pageGraph TK strip intact (no TK anywhere in the node)', () => {
    const stripped = JSON.stringify(pageGraph([node]));
    expect(stripped).toContain('"@type":"RealEstateListing"');
    expect(stripped).not.toContain('TK_');
  });
});

describe('itemListNode', () => {
  it('positions items 1..n with absolute URLs', () => {
    const url = `${ORIGIN}/en/listings`;
    const node = itemListNode(
      [
        { name: '100 Fixture Boulevard', url: URL_1 },
        { name: 'Miami, FL 33131', url: `${ORIGIN}/en/listings/x` },
      ],
      url
    ) as { itemListElement: Record<string, unknown>[] };
    expect(node).toMatchObject({
      '@type': 'ItemList',
      '@id': `${url}#items`,
      numberOfItems: 2,
    });
    expect(node.itemListElement[0]).toMatchObject({
      '@type': 'ListItem',
      position: 1,
      url: URL_1,
    });
    expect(node.itemListElement[1]).toMatchObject({ position: 2 });
  });
});
