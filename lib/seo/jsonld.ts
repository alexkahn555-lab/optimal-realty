import type { Locale } from '@/lib/types';
import { ENTITY, LICENSE_LABEL } from '@/config/entity';
import { SITE_ORIGIN } from '@/config/origin';

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
