import { ImageResponse } from 'next/og';
import { isDiscoverable, publishedListings } from '@/lib/content/loaders';
import { ogCard } from '@/components/listing/OgCard';

/**
 * LISTING OG IMAGE (D3) — /listings/<slug>/opengraph-image, 1200×630,
 * prerendered at build for every published listing (active and sold; sold
 * URLs are permanent). Locale-invariant: both /en and /es listing pages
 * reference this one card via openGraph.images in the [sub] router metadata.
 * Per the reference, per-page OG exists ONLY on the share-heavy listing
 * template — other templates keep their static/site-level OG.
 *
 * FIXTURES GET NO CARD (4c): a share image is a discovery artifact, and a
 * demonstration listing must never travel as a real property or transaction.
 * Excluded from prerender AND guarded at request time.
 */

export const dynamic = 'force-static';

export function generateStaticParams(): { slug: string }[] {
  return publishedListings()
    .filter(isDiscoverable)
    .map((listing) => ({ slug: listing.slug }));
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
): Promise<Response> {
  const { slug } = await context.params;
  const listing = publishedListings().find((l) => l.slug === slug);
  if (!listing || !isDiscoverable(listing)) {
    return new Response('Not found', { status: 404 });
  }

  return new ImageResponse(ogCard(listing), { width: 1200, height: 630 });
}
