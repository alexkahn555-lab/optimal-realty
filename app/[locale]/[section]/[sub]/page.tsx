import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type {
  CalcId,
  LeadIntent,
  Locale,
  Portal,
  PortalSubpage,
  RouteId,
  ToolDef,
} from '@/lib/types';
import { ASSUMPTIONS } from '@/config/assumptions';
import { LEGAL_PAGES, LEGAL_SLUGS, type LegalPageDef } from '@/content/legal';
import { HOME_VALUATION_LEAD_INTENT } from '@/content/subpages/home-valuation';
import { SELLING_PROCESS_LEAD_INTENT } from '@/content/subpages/selling-process';
import { UI } from '@/content/ui-strings';
import { isLocale } from '@/lib/i18n';
import { CALCS, type CalcFormValues } from '@/lib/calc/registry';
import type { FieldSpec } from '@/lib/calc/types';
import {
  ALL_FAQS,
  publishedPortals,
  publishedSubpages,
  publishedTools,
  resolvedFaqs,
} from '@/lib/content/loaders';
import { href } from '@/lib/seo/href';
import { metaFor } from '@/lib/seo/meta';
import {
  AssumptionsTable,
  CalcIsland,
  CalcShell,
} from '@/components/calc';
import {
  LegalTemplate,
  PORTAL_INTENT,
  SubpageTemplate,
} from '@/components/portal';
import type { Crumb } from '@/components/seo';

/**
 * THE LOCALIZED-SEGMENT ROUTER (two segments) — the sibling of [section] for
 * portal subpages (/es/vendedores/valoracion-de-vivienda), tool pages
 * (/es/herramientas/ganancia-neta), and legal children (/es/legal/privacidad).
 * Same registry discipline: href() is the single source of truth, the URL
 * either matches a registered route exactly or 404s (dynamicParams=false).
 */

const LOCALES: readonly Locale[] = ['en', 'es'];

type SubMatch =
  | { kind: 'subpage'; subpage: PortalSubpage; portal: Portal }
  | { kind: 'tool'; tool: ToolDef }
  | { kind: 'legal'; page: LegalPageDef };

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
  }
}

/* ---- Subpage wiring -------------------------------------------------------- */

/** Structural CTA intent per subpage; falls back to the portal's intent. */
const SUBPAGE_INTENT: Record<string, LeadIntent> = {
  'sellers-home-valuation': HOME_VALUATION_LEAD_INTENT,
  'sellers-selling-process': SELLING_PROCESS_LEAD_INTENT,
};

function SubpageView({
  subpage,
  portal,
  locale,
}: {
  subpage: PortalSubpage;
  portal: Portal;
  locale: Locale;
}): JSX.Element {
  const tools = publishedTools().filter((tool) =>
    subpage.relatedToolIds.includes(tool.id)
  );
  // FAQPage rule (Part 4.2): only ids NOT already on the portal hub.
  const faqs = resolvedFaqs(
    ALL_FAQS,
    subpage.faqIds.filter((id) => !portal.faqIds.includes(id))
  );

  return (
    <SubpageTemplate
      subpage={subpage}
      portal={portal}
      tools={tools}
      advice={[]} // no AdviceSections exist yet — AdviceList renders null
      faqs={faqs}
      locale={locale}
      leadIntent={SUBPAGE_INTENT[subpage.id] ?? PORTAL_INTENT[portal.id]}
    />
  );
}

/* ---- Tool (calculator) wiring ---------------------------------------------- */

/** Structural CTA intent per calculator (closed CalcId set). */
const TOOL_INTENT: Record<CalcId, LeadIntent> = {
  'net-proceeds': 'sell',
  'tax-reset': 'buy',
  'homestead-portability': 'sell',
  'condo-assessment': 'buy',
  'rental-cashflow': 'invest',
  'vacancy-cost': 'lease-out',
};

/** Fixed probe date — compute() is pure; dates enter as inputs (never a clock). */
const PROBE_DATE = '2026-01-15';

/** Server-resolved island defaults: assumption-backed values substituted. */
function fieldDefaults(fields: FieldSpec[]): CalcFormValues {
  const defaults: CalcFormValues = {};
  for (const field of fields) {
    if (field.defaultFromAssumption !== undefined) {
      const assumption = ASSUMPTIONS[field.defaultFromAssumption];
      if (assumption !== undefined) {
        defaults[field.key] =
          field.kind === 'boolean' ? assumption.value === 1 : assumption.value;
      }
    } else if (field.default !== undefined) {
      defaults[field.key] = field.default;
    }
  }
  return defaults;
}

/**
 * A minimal valid input for the default-state compute: defaults plus each
 * still-missing required field at its lower bound (dates at the fixed probe).
 * Used ONLY to surface assumptionKeysUsed for the server-rendered table.
 */
function probeValues(fields: FieldSpec[], defaults: CalcFormValues): CalcFormValues {
  const probe: CalcFormValues = { ...defaults };
  for (const field of fields) {
    if (probe[field.key] !== undefined) continue;
    if (field.kind === 'date') probe[field.key] = PROBE_DATE;
    else if (field.kind === 'enum') probe[field.key] = field.enumValues?.[0] ?? '';
    else if (field.kind === 'boolean') probe[field.key] = false;
    else probe[field.key] = field.min ?? 0;
  }
  return probe;
}

function ToolView({ tool, locale }: { tool: ToolDef; locale: Locale }): JSX.Element {
  const calc = CALCS[tool.engineId];
  // A published ToolDef without a registered engine is an authoring error.
  if (!calc) notFound();

  const fields = calc.engine.fields;
  const defaults = fieldDefaults(fields);
  const probe = calc.clampCrossField
    ? calc.clampCrossField(probeValues(fields, defaults))
    : probeValues(fields, defaults);
  const assumptionKeys = calc.engine.compute(
    calc.toInput(probe),
    ASSUMPTIONS
  ).assumptionKeysUsed;

  const crumbs: Crumb[] = [
    { id: 'home', label: UI.breadcrumb.home },
    { id: 'tools', label: UI.nav.tools },
    { id: `tool.${tool.id}`, label: tool.title },
  ];

  return (
    <CalcShell
      tool={tool}
      locale={locale}
      crumbs={crumbs}
      faqs={resolvedFaqs(ALL_FAQS, tool.faqIds)}
    >
      <CalcIsland
        engineId={tool.engineId}
        locale={locale}
        sourceSlug={tool.id}
        leadIntent={TOOL_INTENT[tool.id]}
        fields={fields}
        defaults={defaults}
      />
      <AssumptionsTable keys={assumptionKeys} locale={locale} />
    </CalcShell>
  );
}

/* ---- Page ------------------------------------------------------------------ */

export default async function SubPage({ params }: PageProps): Promise<JSX.Element> {
  const { locale, section, sub } = await params;
  if (!isLocale(locale)) notFound();
  const match = resolveSub(locale, section, sub);
  if (!match) notFound();

  switch (match.kind) {
    case 'subpage':
      return (
        <SubpageView
          subpage={match.subpage}
          portal={match.portal}
          locale={locale}
        />
      );
    case 'tool':
      return <ToolView tool={match.tool} locale={locale} />;
    case 'legal':
      return <LegalTemplate page={match.page} locale={locale} />;
  }
}
