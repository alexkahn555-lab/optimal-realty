import { STATIC_ROUTE_IDS } from '@/lib/seo/href';
import {
  publishedListings,
  publishedPortals,
  publishedTools,
} from '@/lib/content/loaders';
import type { LeadSourceType, PortalId } from '@/lib/types';

/**
 * Source-attribution validation — READS THE REGISTRY, never a hard-coded list.
 *
 * A lead may only claim an attribution that corresponds to a route the site
 * actually publishes: the static route table for `contact`, the published()
 * accessors for entity-backed sources. In Phase 2 the content collections are
 * empty, so `contact` (no slug) is the only combination that validates — that
 * falls out of the registry state, and later phases widen it by publishing
 * content, not by editing this function.
 */
export function isRegisteredSource(
  sourceType: LeadSourceType,
  sourceSlug: string | undefined,
  portal: PortalId | undefined
): boolean {
  switch (sourceType) {
    case 'contact':
      // Static route; carries no slug.
      return sourceSlug === undefined && STATIC_ROUTE_IDS.includes('contact');

    case 'tool':
      return (
        sourceSlug !== undefined &&
        publishedTools().some(
          (t) =>
            t.id === sourceSlug ||
            t.slug.en === sourceSlug ||
            t.slug.es === sourceSlug
        )
      );

    case 'listing':
      return (
        sourceSlug !== undefined &&
        publishedListings().some((l) => l.slug === sourceSlug)
      );

    case 'portal_cta':
      // Attribution rides the `portal` field; portal CTAs carry no slug.
      return (
        sourceSlug === undefined &&
        portal !== undefined &&
        publishedPortals().some((p) => p.id === portal)
      );

    case 'booking':
      // No booking surface is registered until the booking phase ships one.
      return false;
  }
}
