import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Locale, Portal } from '@/lib/types';
import { SITE_ORIGIN } from '@/config/origin';
import { ABOUT_ANSWER } from '@/content/about';
import { UI } from '@/content/ui-strings';
import { isLocale, t } from '@/lib/i18n';
import { publishedPortals, publishedTools } from '@/lib/content/loaders';
import { href } from '@/lib/seo/href';
import { collectionPageNode, pageGraph, profilePageNodes } from '@/lib/seo/jsonld';
import { metaFor } from '@/lib/seo/meta';
import { AnswerBlock, Breadcrumbs, JsonLd } from '@/components/seo';
import { AboutTemplate } from '@/components/portal/AboutTemplate';
import { ToolRack } from '@/components/portal/ToolRack';
import { Heading, Section } from '@/components/primitives';

/**
 * THE LOCALIZED-SEGMENT ROUTER (single segment). Literal folder names cannot
 * localize (/es/vendedores), so the segment is a dynamic param whose legal
 * values come from the route registry: href() is the single source of truth
 * and this page dispatches on an exact match. Phase 2 shipped contact; Phase 3
 * extends the SAME router (never per-page forks) with the sellers portal hub,
 * the tools hub, and about. dynamicParams=false 404s everything else at the
 * routing layer. Two-segment routes live in the sibling [sub] router.
 *
 * IMPORT-GRAPH DISCIPLINE (Part 8): every [section] URL shares THIS page
 * module, and Turbopack assigns client chunks per segment — a static import
 * that reaches a client island ships that island to every URL here, including
 * the form-less tools hub and about page. So LeadForm-bearing views
 * (ContactView, PortalView → PortalTemplate → LeadCta) live in sibling
 * modules imported dynamically per branch, and AboutTemplate/ToolRack are
 * imported from their concrete files (never the portal barrel, whose graph
 * reaches LeadForm). Do not add a static import here that reaches a
 * 'use client' module.
 */

const LOCALES: readonly Locale[] = ['en', 'es'];

/** Answer freshness date — bump when the answer copy changes. */
const TOOLS_HUB_UPDATED = '2026-07-26' as const;

type SectionMatch =
  | { kind: 'contact' }
  | { kind: 'portal'; portal: Portal }
  | { kind: 'tools' }
  | { kind: 'about' };

/** Registry-driven resolution: the URL either IS a registered route or 404s. */
function resolveSection(locale: Locale, section: string): SectionMatch | null {
  const pathname = `/${locale}/${section}`;
  if (pathname === href('contact', locale)) return { kind: 'contact' };
  if (pathname === href('tools', locale)) return { kind: 'tools' };
  if (pathname === href('about', locale)) return { kind: 'about' };
  for (const portal of publishedPortals()) {
    if (pathname === href(`portal.${portal.id}`, locale)) {
      return { kind: 'portal', portal };
    }
  }
  return null;
}

/** Last path segment of a registered route — the param value for this router. */
function lastSegment(pathname: string): string {
  const segments = pathname.split('/');
  return segments[segments.length - 1] as string;
}

export const dynamicParams = false;

export function generateStaticParams(): { locale: Locale; section: string }[] {
  return LOCALES.flatMap((locale) => [
    { locale, section: lastSegment(href('contact', locale)) },
    { locale, section: lastSegment(href('tools', locale)) },
    { locale, section: lastSegment(href('about', locale)) },
    ...publishedPortals().map((portal) => ({
      locale,
      section: lastSegment(href(`portal.${portal.id}`, locale)),
    })),
  ]);
}

interface PageProps {
  params: Promise<{ locale: string; section: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, section } = await params;
  if (!isLocale(locale)) return {};
  const match = resolveSection(locale, section);
  if (!match) return {};

  switch (match.kind) {
    case 'contact':
      return metaFor(
        { id: 'contact', title: UI.nav.contact, description: UI.contact.answer },
        locale
      );
    case 'portal':
      return metaFor(
        {
          id: `portal.${match.portal.id}`,
          title: match.portal.title,
          description: match.portal.answer.answer,
        },
        locale
      );
    case 'tools':
      return metaFor(
        { id: 'tools', title: UI.nav.tools, description: UI.toolsHub.answer },
        locale
      );
    case 'about':
      return metaFor(
        { id: 'about', title: UI.nav.about, description: ABOUT_ANSWER.answer },
        locale
      );
  }
}

/* ---- Zero-JS views (static imports only — no client reach) ----------------- */

function ToolsHubView({ locale }: { locale: Locale }): JSX.Element {
  const url = `${SITE_ORIGIN}${href('tools', locale)}`;

  return (
    <Section className="py-16 md:py-24">
      <div className="space-y-12">
        <Breadcrumbs
          items={[
            { id: 'home', label: UI.breadcrumb.home },
            { id: 'tools', label: UI.nav.tools },
          ]}
          locale={locale}
        />
        <Heading level={1}>{t(UI.toolsHub.question, locale)}</Heading>
        <AnswerBlock
          block={{
            question: UI.toolsHub.question,
            answer: UI.toolsHub.answer,
            updated: TOOLS_HUB_UPDATED,
          }}
          locale={locale}
        />
        <ToolRack
          tools={publishedTools()}
          locale={locale}
          heading={UI.sections.toolRack}
        />
      </div>
      <JsonLd
        graph={pageGraph([
          collectionPageNode(UI.nav.tools, UI.toolsHub.answer, url, locale),
        ])}
      />
    </Section>
  );
}

function AboutView({ locale }: { locale: Locale }): JSX.Element {
  const url = `${SITE_ORIGIN}${href('about', locale)}`;

  return (
    <>
      <AboutTemplate locale={locale} />
      <JsonLd graph={pageGraph(profilePageNodes(url, locale))} />
    </>
  );
}

export default async function SectionPage({ params }: PageProps): Promise<JSX.Element> {
  const { locale, section } = await params;
  if (!isLocale(locale)) notFound();
  const match = resolveSection(locale, section);
  if (!match) notFound();

  switch (match.kind) {
    case 'contact': {
      const { ContactView } = await import('./contact-view');
      return <ContactView locale={locale} />;
    }
    case 'portal': {
      const { PortalView } = await import('./portal-view');
      return <PortalView portal={match.portal} locale={locale} />;
    }
    case 'tools':
      return <ToolsHubView locale={locale} />;
    case 'about':
      return <AboutView locale={locale} />;
  }
}
