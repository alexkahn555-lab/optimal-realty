import type { SiteConfig } from '@/lib/types';
import { SITE_ORIGIN } from '@/config/origin';

/**
 * Single source for footer NAP, JSON-LD graph, contact page, email signatures,
 * and Google Business Profile (Part 2.5). grep for the phone number must return
 * exactly one file — this one.
 *
 * Confirmed facts are hard-coded. Unconfirmed contact data is a literal 'TK_...'
 * string so check-content.mjs strict mode blocks a launch that still contains it.
 */
export const ENTITY: SiteConfig = {
  origin: SITE_ORIGIN,
  entity: {
    legalName: 'TK_LEGAL_NAME',
    tradeName: 'Optimal Realty',
    licenses: [
      { role: 'broker', number: 'BK3446865' },
      { role: 'appraiser', number: 'RD8416' },
      { role: 'cam', number: 'CAM64581' },
    ],
    phone: 'TK_PHONE_E164',
    email: 'TK_EMAIL',
    address: {
      line1: 'TK_ADDRESS_LINE1',
      city: 'TK_CITY',
      state: 'FL',
      zip: 'TK_ZIP',
    },
    sameAs: [], // GBP URL + profiles — TK, populated at Phase 6
    founder: { name: 'Raul Perez' },
  },
};

/**
 * Positioning facts (Part 2.5). USMC veteran; FSU economics; single-agency
 * standard. Individual NAR designation list is TK_ (D-03) — nine designations
 * confirmed in count, not yet enumerated.
 */
export const POSITIONING = {
  militaryService: 'USMC',
  education: 'Florida State University, Economics',
  narDesignationCount: 9,
  narDesignations: [] as string[], // TK_ — enumerate at D-03
  standard: 'single-agency', // one client, undivided loyalty, per transaction
  serviceArea: 'Miami-Dade County, Florida',
  listingsPolicy: 'own-listings-only', // no IDX, confirmed
} as const;

export const LICENSE_LABEL: Record<'broker' | 'appraiser' | 'cam', string> = {
  broker: 'Florida Real Estate Broker',
  appraiser: 'Florida Certified Appraiser',
  cam: 'Community Association Manager',
};
