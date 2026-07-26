import type { Localized } from '@/lib/types';

/**
 * Listing-report disclosure copy (rendered by the DisclosureBlock, M14 zone).
 * The license line itself is assembled in the component from config/entity.ts
 * (confirmed facts). The brokerage-relationship notice is ATTORNEY/BROKER copy
 * — never agent-drafted — so it ships as a placeholder marker and renders as a
 * visible PlaceholderTK in preview until the client supplies it (FL brokerage
 * relationship disclosure, Ch. 475 Part III — wording is counsel's call).
 */
export const LISTING_DISCLOSURE: { brokerageRelationshipNotice: Localized } = {
  brokerageRelationshipNotice: {
    en: 'TK_BROKERAGE_RELATIONSHIP_NOTICE',
    es: 'TK_BROKERAGE_RELATIONSHIP_NOTICE',
  },
};
