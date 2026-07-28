import { ENTITY, LICENSE_LABEL, POSITIONING } from '@/config/entity';
import { SITE_ORIGIN } from '@/config/origin';
import {
  activeListings,
  isDiscoverable,
  publishedPortals,
  publishedSubpages,
  publishedTools,
  soldListings,
} from '@/lib/content/loaders';
import { href } from '@/lib/seo/href';
import { displayAddress } from '@/components/listing/helpers';
import type { RouteId } from '@/lib/types';

export const dynamic = 'force-static';

/** One llms.txt line: EN label, EN + ES URLs (labels are en — llms.txt is EN). */
function line(label: string, id: RouteId): string {
  return `- ${label}: ${SITE_ORIGIN}${href(id, 'en')} · ${SITE_ORIGIN}${href(id, 'es')}`;
}

export function GET(): Response {
  const { tradeName, licenses } = ENTITY.entity;
  const licenseLine = licenses
    .map((license) => `${LICENSE_LABEL[license.role]} (${license.number})`)
    .join(', ');

  const lines = [
    ...publishedPortals().map((p) => line(p.title.en, `portal.${p.id}` as RouteId)),
    ...publishedSubpages().map((s) => line(s.title.en, `subpage.${s.id}` as RouteId)),
    line('Tools', 'tools'),
    ...publishedTools().map((tool) =>
      line(tool.title.en, `tool.${tool.id}` as RouteId)
    ),
    line('Listings', 'listings'),
    // Labels run through the privacy degradation; sold pages are permanent.
    // Fixtures are excluded (4c): llms.txt is a discovery surface.
    ...activeListings()
      .filter(isDiscoverable)
      .map((listing) =>
        line(displayAddress(listing).heading, `listing.${listing.slug}` as RouteId)
      ),
    line('Sold listings', 'listings.sold'),
    ...soldListings()
      .filter(isDiscoverable)
      .map((listing) =>
        line(displayAddress(listing).heading, `listing.${listing.slug}` as RouteId)
      ),
    line('About', 'about'),
    line('Contact', 'contact'),
  ];

  const body = `# ${tradeName}\n> ${licenseLine}. ${POSITIONING.serviceArea}.\n\n${lines.join('\n')}\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
