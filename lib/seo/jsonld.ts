import type {
  Listing,
  Locale,
  Localized,
  Portal,
  PortalSubpage,
  PropertyClass,
  ToolDef,
} from '@/lib/types';
import { ENTITY, LICENSE_LABEL, POSITIONING } from '@/config/entity';
import { SITE_ORIGIN } from '@/config/origin';
import { displayAddress } from '@/components/listing/helpers';

/**
 * ============================================================================
 * ENTITY JSON-LD GRAPH — the organization/founder/site knowledge graph.
 * ============================================================================
 *
 * HARD RULE (implemented here, not delegated): any field whose value matches
 * /\bTK_/ is OMITTED from the emitted graph. Previews never serve placeholder
 * strings as structured data. This is enforced by `stripTK` below, applied to the
 * whole graph before it is returned — a marker cannot leak into a <script> tag.
 *
 * Confirmed values that DO emit: trade name, the three licenses (held by the
 * individual broker), founder, areaServed (Miami-Dade County), knowsLanguage en+es.
 * Unconfirmed contact data (legalName, phone, email, street/city/zip, sameAs) is
 * TK_ in config/entity.ts and drops out automatically.
 *
 * @id stability: the graph describes ONE real-world entity and is locale-invariant.
 * The @ids and urls are origin-based so /en and /es merge to the same nodes for a
 * crawler. The `locale` parameter is accepted for a stable per-page API (the layout
 * emits this once per page) but does not fork the entity's identity.
 */

export interface JsonLdGraph {
  '@context': 'https://schema.org';
  '@graph': Record<string, unknown>[];
}

const TK = /\bTK_/;

/**
 * Recursively drop every string value that carries a TK_ marker, plus any array
 * emptied by that pruning. Objects are preserved with their surviving (confirmed)
 * fields; JSON-LD @id references (`{ '@id': ... }`) survive because their value is
 * a confirmed origin URL, never a marker.
 */
function stripTK(value: unknown): unknown {
  if (typeof value === 'string') {
    return TK.test(value) ? undefined : value;
  }
  if (Array.isArray(value)) {
    const cleaned = value.map(stripTK).filter((v) => v !== undefined);
    return cleaned.length > 0 ? cleaned : undefined;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      const cleaned = stripTK(val);
      if (cleaned !== undefined) out[key] = cleaned;
    }
    return out;
  }
  return value;
}

/** Build the confirmed entity graph for a locale (locale-invariant identity). */
export function entityGraph(locale: Locale): JsonLdGraph {
  const origin = SITE_ORIGIN;
  const agentId = `${origin}/#agent`;
  const raulId = `${origin}/#raul`;
  const websiteId = `${origin}/#website`;

  const { entity } = ENTITY;
  // Current locale first — order only; both languages always present.
  const langs: Locale[] = locale === 'es' ? ['es', 'en'] : ['en', 'es'];

  // Credentials are held by the individual broker (FL licenses attach to a person).
  const credentials = entity.licenses.map((license) => ({
    '@type': 'EducationalOccupationalCredential',
    credentialCategory: LICENSE_LABEL[license.role],
    identifier: license.number,
  }));

  const agent = {
    '@type': 'RealEstateAgent',
    '@id': agentId,
    name: entity.tradeName,
    legalName: entity.legalName, // TK_ → stripped
    url: origin,
    areaServed: { '@type': 'AdministrativeArea', name: 'Miami-Dade County' },
    knowsLanguage: langs,
    founder: { '@id': raulId },
    telephone: entity.phone, // TK_ → stripped
    email: entity.email, // TK_ → stripped
    address: {
      '@type': 'PostalAddress',
      streetAddress: entity.address.line1, // TK_ → stripped
      addressLocality: entity.address.city, // TK_ → stripped
      addressRegion: entity.address.state, // 'FL' — confirmed
      postalCode: entity.address.zip, // TK_ → stripped
      addressCountry: 'US',
    },
    sameAs: entity.sameAs, // [] → stripped
  };

  const raul = {
    '@type': 'Person',
    '@id': raulId,
    name: entity.founder.name,
    jobTitle: LICENSE_LABEL.broker,
    worksFor: { '@id': agentId },
    knowsLanguage: langs,
    hasCredential: credentials,
    ...(entity.founder.sameAs ? { sameAs: entity.founder.sameAs } : {}),
  };

  const website = {
    '@type': 'WebSite',
    '@id': websiteId,
    url: origin,
    name: entity.tradeName,
    inLanguage: langs,
    publisher: { '@id': agentId },
  };

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [agent, raul, website],
  };

  // Personal hard rule: strip every TK_ before the graph can be serialized.
  return stripTK(graph) as JsonLdGraph;
}

/* ==========================================================================
 * Phase 3 — per-route-class node builders (Part 4.2). Every node REFERENCES
 * #agent / #raul by @id and never redeclares them; every builder passes
 * through pageGraph() so a TK_ marker cannot leak into a <script> tag.
 * Builders take the absolute page URL — href() stays the caller's concern.
 * ========================================================================== */

const AGENT_ID = `${SITE_ORIGIN}/#agent`;
const RAUL_ID = `${SITE_ORIGIN}/#raul`;

/** Wrap page nodes in a @graph with the TK strip applied. */
export function pageGraph(nodes: Record<string, unknown>[]): JsonLdGraph {
  return stripTK({ '@context': 'https://schema.org', '@graph': nodes }) as JsonLdGraph;
}

/** Portal hub: each portal is literally one service offering (provider → #agent). */
export function serviceNode(
  portal: Portal,
  url: string,
  locale: Locale
): Record<string, unknown> {
  return {
    '@type': 'Service',
    '@id': `${url}#service`,
    serviceType: portal.serviceSchema.serviceType,
    name: portal.title[locale],
    description: portal.answer.answer[locale],
    url,
    inLanguage: locale,
    provider: { '@id': AGENT_ID },
    areaServed: { '@type': 'AdministrativeArea', name: 'Miami-Dade County' },
  };
}

/** Portal subpage: Article, author → #raul, dateModified from the answer. */
export function articleNode(
  subpage: PortalSubpage,
  url: string,
  locale: Locale
): Record<string, unknown> {
  return {
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: subpage.title[locale],
    description: subpage.answer.answer[locale],
    url,
    inLanguage: locale,
    author: { '@id': RAUL_ID },
    publisher: { '@id': AGENT_ID },
    dateModified: subpage.answer.updated,
    mainEntityOfPage: url,
  };
}

/** Calculator page: calculators are applications, not articles. */
export function webApplicationNode(
  tool: ToolDef,
  url: string,
  locale: Locale
): Record<string, unknown> {
  return {
    '@type': 'WebApplication',
    '@id': `${url}#app`,
    name: tool.title[locale],
    description: tool.answer.answer[locale],
    url,
    inLanguage: locale,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    provider: { '@id': AGENT_ID },
  };
}

/** Index routes (tools hub, later listings/neighborhood indexes). */
export function collectionPageNode(
  name: Localized,
  description: Localized,
  url: string,
  locale: Locale
): Record<string, unknown> {
  return {
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    name: name[locale],
    description: description[locale],
    url,
    inLanguage: locale,
    isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
  };
}

/**
 * About: ProfilePage + the Person E-E-A-T payload. The Person node EXTENDS the
 * site-wide #raul by @id (same merge pattern the contact page set for #agent)
 * with confirmed facts only — FSU economics, USMC service, NAR membership.
 * The individual NAR designation list is TK (D-03) and therefore absent.
 */
export function profilePageNodes(url: string, locale: Locale): Record<string, unknown>[] {
  return [
    {
      '@type': 'ProfilePage',
      '@id': `${url}#profile`,
      url,
      inLanguage: locale,
      mainEntity: { '@id': RAUL_ID },
      about: { '@id': AGENT_ID },
    },
    {
      '@type': 'Person',
      '@id': RAUL_ID,
      name: ENTITY.entity.founder.name,
      jobTitle: LICENSE_LABEL.broker,
      worksFor: { '@id': AGENT_ID },
      alumniOf: {
        '@type': 'CollegeOrUniversity',
        name: 'Florida State University',
      },
      memberOf: {
        '@type': 'Organization',
        name: 'National Association of REALTORS',
      },
      hasOccupation: {
        '@type': 'Occupation',
        name: LICENSE_LABEL.broker,
        occupationLocation: {
          '@type': 'AdministrativeArea',
          name: POSITIONING.serviceArea,
        },
      },
    },
  ];
}

/* ==========================================================================
 * Phase 4a — listing builders (Part 7.3 / D4). Same discipline as above:
 * every node REFERENCES #agent by @id and never redeclares it; callers pass
 * absolute URLs and wrap through pageGraph() (TK strip). BreadcrumbList is
 * emitted by the Breadcrumbs component, never duplicated here.
 * ========================================================================== */

/**
 * schema.org dwelling subtype per PropertyClass. Only marketed residential
 * classes have a precise subtype; land/commercial fall back to Place (no
 * dwelling props are emitted for them that would be wrong — the builder only
 * attaches beds/baths/floorSize when the facts carry them).
 */
const DWELLING_TYPE: Record<PropertyClass, string> = {
  'single-family': 'SingleFamilyResidence',
  condo: 'Apartment',
  townhouse: 'House',
  'multi-family': 'ApartmentComplex',
  land: 'Place',
  commercial: 'Place',
};

/**
 * PostalAddress for a listing, DEGRADED per the showFullAddress privacy flag:
 * street line (and unit) only when the listing shows its address; otherwise
 * city/region/zip only. GeoCoordinates follow the same flag in the listing
 * node — a precise pin would defeat address privacy.
 */
export function listingPostalAddressNode(listing: Listing): Record<string, unknown> {
  const base: Record<string, unknown> = {
    '@type': 'PostalAddress',
    addressLocality: listing.address.city,
    addressRegion: listing.address.state,
    postalCode: listing.address.zip,
    addressCountry: 'US',
  };
  if (!listing.showFullAddress) return base;
  const { line1, unit } = listing.address;
  return {
    ...base,
    streetAddress: unit === undefined ? line1 : `${line1} #${unit}`,
  };
}

/**
 * The listing-report node: RealEstateListing whose `about` is the dwelling
 * subtype by class, with Offer (availability InStock — this builder serves
 * MARKETED listings; the sold archive is a Phase 4b builder), ImageObject[]
 * with intrinsic dimensions, and the degraded PostalAddress/GeoCoordinates.
 */
export function realEstateListingNode(
  listing: Listing,
  url: string,
  locale: Locale
): Record<string, unknown> {
  const address = displayAddress(listing);
  const facts = listing.facts;

  const dwelling: Record<string, unknown> = {
    '@type': DWELLING_TYPE[listing.class],
    name: address.heading,
    address: listingPostalAddressNode(listing),
    numberOfBedrooms: facts.beds,
    numberOfFullBathrooms: facts.bathsFull,
    floorSize: { '@type': 'QuantitativeValue', value: facts.sqft, unitCode: 'FTK' },
    yearBuilt: facts.yearBuilt,
  };
  if (facts.bathsHalf > 0) dwelling.numberOfPartialBathrooms = facts.bathsHalf;
  if (listing.showFullAddress) {
    dwelling.geo = {
      '@type': 'GeoCoordinates',
      latitude: listing.geo.lat,
      longitude: listing.geo.lng,
    };
  }

  return {
    '@type': 'RealEstateListing',
    '@id': `${url}#listing`,
    url,
    name: address.heading,
    description: listing.summary[locale],
    inLanguage: locale,
    datePosted: listing.dates.listed,
    mainEntityOfPage: url,
    provider: { '@id': AGENT_ID },
    about: dwelling,
    image: listing.media.map((asset) => ({
      '@type': 'ImageObject',
      contentUrl: `${SITE_ORIGIN}${asset.src}`,
      width: asset.w,
      height: asset.h,
      caption: asset.alt[locale],
    })),
    offers: {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      offeredBy: { '@id': AGENT_ID },
    },
  };
}

/** Index ItemList — pairs with collectionPageNode on the listings index. */
export function itemListNode(
  items: { name: string; url: string }[],
  url: string
): Record<string, unknown> {
  return {
    '@type': 'ItemList',
    '@id': `${url}#items`,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}
