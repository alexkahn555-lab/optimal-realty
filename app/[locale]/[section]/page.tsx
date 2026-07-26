import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Locale, Portal } from '@/lib/types';
import { ENTITY, LICENSE_LABEL } from '@/config/entity';
import { SITE_ORIGIN } from '@/config/origin';
import { ABOUT_ANSWER } from '@/content/about';
import { UI } from '@/content/ui-strings';
import { isLocale, t } from '@/lib/i18n';
import {
  ALL_FAQS,
  publishedPortals,
  publishedTools,
  resolvedFaqs,
} from '@/lib/content/loaders';
import { href } from '@/lib/seo/href';
import { collectionPageNode, pageGraph, profilePageNodes } from '@/lib/seo/jsonld';
import { metaFor } from '@/lib/seo/meta';
import { AnswerBlock, Breadcrumbs, JsonLd } from '@/components/seo';
import { LeadForm } from '@/components/forms';
import { AboutTemplate, PortalTemplate, ToolRack } from '@/components/portal';
import { Hairline, Heading, Section } from '@/components/primitives';

/**
 * THE LOCALIZED-SEGMENT ROUTER (single segment). Literal folder names cannot
 * localize (/es/vendedores), so the segment is a dynamic param whose legal
 * values come from the route registry: href() is the single source of truth
 * and this page dispatches on an exact match. Phase 2 shipped contact; Phase 3
 * extends the SAME router (never per-page forks) with the sellers portal hub,
 * the tools hub, and about. dynamicParams=false 404s everything else at the
 * routing layer. Two-segment routes live in the sibling [sub] router.
 */

const LOCALES: readonly Locale[] = ['en', 'es'];

/** Answer freshness dates — bump when the answer copy changes. */
const CONTACT_ANSWER_UPDATED = '2026-07-20' as const;
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

const TK = /\bTK_/;

/** Flat TK omission for the JSON-LD nodes below (page-local; entity graph has its own). */
function withoutTk(node: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(node).filter(
      ([, value]) => typeof value !== 'string' || !TK.test(value)
    )
  );
}

/** ContactPage + ContactPoint, merged onto the entity graph via the #agent @id. */
function contactGraph(locale: Locale): object {
  const url = `${SITE_ORIGIN}${href('contact', locale)}`;
  const agentId = `${SITE_ORIGIN}/#agent`;

  const page = {
    '@type': 'ContactPage',
    '@id': `${url}#contactpage`,
    url,
    name: t(UI.contact.question, locale),
    inLanguage: locale,
    dateModified: CONTACT_ANSWER_UPDATED,
    about: { '@id': agentId },
  };

  const contactPoint = withoutTk({
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: ['en', 'es'],
    telephone: ENTITY.entity.phone,
    email: ENTITY.entity.email,
  });

  return {
    '@context': 'https://schema.org',
    '@graph': [page, { '@type': 'RealEstateAgent', '@id': agentId, contactPoint }],
  };
}

/* ---- Views ---------------------------------------------------------------- */

function ContactView({ locale }: { locale: Locale }): JSX.Element {
  const { address } = ENTITY.entity;
  const addressLine = !TK.test(address.line1)
    ? [address.line1, address.city, address.state, address.zip]
        .filter((value) => !TK.test(value))
        .join(', ')
    : null;

  return (
    <Section className="py-16 md:py-24">
      <div className="space-y-8">
        <Heading level={1}>{t(UI.contact.question, locale)}</Heading>
        <AnswerBlock
          block={{
            question: UI.contact.question,
            answer: UI.contact.answer,
            updated: CONTACT_ANSWER_UPDATED,
          }}
          locale={locale}
        />
        <Hairline />
        <div className="grid gap-12 md:grid-cols-[3fr,2fr]">
          <div className="space-y-8">
            <LeadForm locale={locale} sourceType="contact" />
          </div>
          <div className="space-y-8">
            <div className="space-y-8">
              {!TK.test(ENTITY.entity.tradeName) && (
                <p className="font-display text-lg text-ink">{ENTITY.entity.tradeName}</p>
              )}
              <div className="space-y-1 text-ink">
                {!TK.test(ENTITY.entity.phone) && <p>{ENTITY.entity.phone}</p>}
                {!TK.test(ENTITY.entity.email) && <p>{ENTITY.entity.email}</p>}
                {addressLine && <p>{addressLine}</p>}
              </div>
            </div>
            <Hairline />
            <div className="space-y-1">
              {ENTITY.entity.licenses.map((license) =>
                !TK.test(LICENSE_LABEL[license.role]) && !TK.test(license.number) ? (
                  <div
                    key={license.role}
                    className="font-mono text-sm tabular-nums text-ink"
                  >
                    {`${LICENSE_LABEL[license.role]} · ${license.number}`}
                  </div>
                ) : null
              )}
            </div>
          </div>
        </div>
      </div>
      <JsonLd graph={contactGraph(locale)} />
    </Section>
  );
}

function PortalView({
  portal,
  locale,
}: {
  portal: Portal;
  locale: Locale;
}): JSX.Element {
  const tools = publishedTools().filter((tool) => portal.toolIds.includes(tool.id));
  const faqs = resolvedFaqs(ALL_FAQS, portal.faqIds);

  return (
    <PortalTemplate
      portal={portal}
      tools={tools}
      advice={[]} // no AdviceSections exist yet — AdviceList renders null
      faqs={faqs}
      locale={locale}
    />
  );
}

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
    case 'contact':
      return <ContactView locale={locale} />;
    case 'portal':
      return <PortalView portal={match.portal} locale={locale} />;
    case 'tools':
      return <ToolsHubView locale={locale} />;
    case 'about':
      return <AboutView locale={locale} />;
  }
}
