import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type {
  Listing,
  Locale,
  Portal,
  PortalSubpage,
  RouteId,
  ToolDef,
} from '@/lib/types';
import { LEGAL_PAGES, LEGAL_SLUGS, type LegalPageDef } from '@/content/legal';
import { isLocale } from '@/lib/i18n';
import {
  activeListings,
  isDiscoverable,
  isSoldArchived,
  localizedClean,
  publishedPortals,
  publishedSubpages,
  publishedTools,
  soldListings,
} from '@/lib/content/loaders';
import { SITE_ORIGIN } from '@/config/origin';
import { LISTING_UI } from '@/components/listing/strings';
import { href } from '@/lib/seo/href';
import { metaFor } from '@/lib/seo/meta';
import { displayAddress } from '@/components/listing/helpers';
import { LegalTemplate } from '@/components/portal/LegalTemplate';

/**
 * THE LOCALIZED-SEGMENT ROUTER (two segments) — the sibling of [section] for
 * portal subpages (/es/vendedores/valoracion-de-vivienda), tool pages
 * (/es/herramientas/ganancia-neta), and legal children (/es/legal/privacidad).
 * Same registry discipline: href() is the single source of truth, the URL
 * either matches a registered route exactly or 404s (dynamicParams=false).
 *
 * IMPORT-GRAPH DISCIPLINE (Part 8): every [sub] URL shares THIS page module,
 * and Turbopack assigns client chunks per segment — a static import that
 * reaches a client island ships that island to every URL here, including
 * legal pages that must ship zero JS. So island-bearing views (ToolView →
 * CalcIsland, SubpageView → LeadForm) live in sibling modules imported
 * dynamically per branch, and LegalTemplate is imported from its concrete
 * file (never the portal barrel, whose graph reaches LeadForm). Do not add a
 * static import here that reaches a 'use client' module.
 */

const LOCALES: readonly Locale[] = ['en', 'es'];

type SubMatch =
  | { kind: 'subpage'; subpage: PortalSubpage; portal: Portal }
  | { kind: 'tool'; tool: ToolDef }
  | { kind: 'legal'; page: LegalPageDef }
  | { kind: 'soldIndex' }
  | { kind: 'listing'; listing: Listing };

function resolveSub(locale: Locale, section: string, sub: string): SubMatch | null {
  const pathname = `/${locale}/${section}/${sub}`;
  for (const subpage of publishedSubpages()) {
    if (href(`subpage.${subpage.id}`, locale) === pathname) {
      const portal = publishedPortals().find((p) => p.id === subpage.portalId);
      return portal ? { kind: 'subpage', subpage, portal } : null;
    }
  }
  for (const tool of publishedTools()) {
    if (href(`tool.${tool.id}`, locale) === pathname) return { kind: 'tool', tool };
  }
  for (const slug of LEGAL_SLUGS) {
    if (href(`legal.${slug}`, locale) === pathname) {
      return { kind: 'legal', page: LEGAL_PAGES[slug] };
    }
  }
  // The sold-archive index resolves BEFORE listing slugs (the registry slug
  // 'sold'/'vendidas' is reserved; no listing slug may shadow it).
  if (pathname === href('listings.sold', locale)) return { kind: 'soldIndex' };
  // Marketed listings render the report; sold/leased keep their URL
  // permanently and render the closed-transaction record (Phase 4b).
  for (const listing of [...activeListings(), ...soldListings()]) {
    if (href(`listing.${listing.slug}`, locale) === pathname) {
      return { kind: 'listing', listing };
    }
  }
  return null;
}

function routeParams(
  locale: Locale,
  id: RouteId
): { locale: Locale; section: string; sub: string } {
  const [, , section, sub] = href(id, locale).split('/');
  return { locale, section: section as string, sub: sub as string };
}

export const dynamicParams = false;

export function generateStaticParams(): {
  locale: Locale;
  section: string;
  sub: string;
}[] {
  return LOCALES.flatMap((locale) => [
    ...publishedSubpages().map((s) => routeParams(locale, `subpage.${s.id}`)),
    ...publishedTools().map((tool) => routeParams(locale, `tool.${tool.id}`)),
    ...LEGAL_SLUGS.map((slug) => routeParams(locale, `legal.${slug}`)),
    routeParams(locale, 'listings.sold'),
    ...[...activeListings(), ...soldListings()].map((listing) =>
      routeParams(locale, `listing.${listing.slug}`)
    ),
  ]);
}

interface PageProps {
  params: Promise<{ locale: string; section: string; sub: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, section, sub } = await params;
  if (!isLocale(locale)) return {};
  const match = resolveSub(locale, section, sub);
  if (!match) return {};

  switch (match.kind) {
    case 'subpage':
      return metaFor(
        {
          id: `subpage.${match.subpage.id}`,
          title: match.subpage.title,
          description: match.subpage.answer.answer,
        },
        locale
      );
    case 'tool':
      return metaFor(
        {
          id: `tool.${match.tool.id}`,
          title: match.tool.title,
          description: match.tool.answer.answer,
        },
        locale
      );
    case 'legal':
      // Skeleton phase: the body is an attorney placeholder, so the title
      // doubles as description and the page stays noindex (and out of the
      // sitemap) until real copy lands.
      return {
        ...metaFor(
          {
            id: `legal.${match.page.id}`,
            title: match.page.title,
            description: match.page.title,
          },
          locale
        ),
        robots: { index: false, follow: true },
      };
    case 'soldIndex':
      // The intro is client-reviewed copy; while it is a TK_ placeholder the
      // title doubles as description — a placeholder never ships as SERP copy.
      return metaFor(
        {
          id: 'listings.sold',
          title: LISTING_UI.sold.indexTitle,
          description: localizedClean(LISTING_UI.sold.indexIntro)
            ? LISTING_UI.sold.indexIntro
            : LISTING_UI.sold.indexTitle,
        },
        locale
      );
    case 'listing': {
      // Title = the privacy-degraded address heading (locale-invariant);
      // description = the auto-templated summary (TK-gated at publish).
      // og:image = the build-time branded card (D3) — structured data on a
      // card, never a fabricated property photo.
      const heading = displayAddress(match.listing).heading;
      const meta = metaFor(
        {
          id: `listing.${match.listing.slug}`,
          title: { en: heading, es: heading },
          description: match.listing.summary,
        },
        locale
      );
      // Fixtures get NO share card (4c): the OG route neither prerenders nor
      // serves one, so the metadata must not reference it either.
      if (!isDiscoverable(match.listing)) return meta;
      return {
        ...meta,
        openGraph: {
          ...meta.openGraph,
          images: [
            {
              url: `${SITE_ORIGIN}/listings/${match.listing.slug}/opengraph-image`,
              width: 1200,
              height: 630,
              alt: heading,
            },
          ],
        },
      };
    }
  }
}

export default async function SubPage({ params }: PageProps): Promise<JSX.Element> {
  const { locale, section, sub } = await params;
  if (!isLocale(locale)) notFound();
  const match = resolveSub(locale, section, sub);
  if (!match) notFound();

  switch (match.kind) {
    case 'subpage': {
      const { SubpageView } = await import('./subpage-view');
      return (
        <SubpageView
          subpage={match.subpage}
          portal={match.portal}
          locale={locale}
        />
      );
    }
    case 'tool': {
      const { ToolView } = await import('./tool-view');
      return <ToolView tool={match.tool} locale={locale} />;
    }
    case 'legal':
      return <LegalTemplate page={match.page} locale={locale} />;
    case 'soldIndex': {
      const { SoldIndexView } = await import('./sold-index-view');
      return <SoldIndexView locale={locale} />;
    }
    case 'listing': {
      if (isSoldArchived(match.listing)) {
        const { SoldDetailView } = await import('./sold-detail-view');
        return <SoldDetailView listing={match.listing} locale={locale} />;
      }
      const { ListingReportView } = await import('./listing-report-view');
      return <ListingReportView listing={match.listing} locale={locale} />;
    }
  }
}
