import { notFound } from 'next/navigation';
import type { CalcId, LeadIntent, Locale, ToolDef } from '@/lib/types';
import { ASSUMPTIONS } from '@/config/assumptions';
import { UI } from '@/content/ui-strings';
import { CALCS, type CalcFormValues } from '@/lib/calc/registry';
import type { FieldSpec } from '@/lib/calc/types';
import { ALL_FAQS, resolvedFaqs } from '@/lib/content/loaders';
import { AssumptionsTable } from '@/components/calc/AssumptionsTable';
import { CalcIsland } from '@/components/calc/CalcIslandLazy';
import { CalcShell } from '@/components/calc/CalcShell';
import type { Crumb } from '@/components/seo';

/**
 * TOOL (CALCULATOR) VIEW — the [sub] router's calculator branch, split out of
 * the page module so the router's static graph stays island-free. CalcIsland
 * enters through the CalcIslandLazy client boundary, never the static island:
 * all [sub] URLs share one page entry, and a static island import would ride
 * the calculator into every subpage and legal document (Part 8: CalcIsland
 * only where used). CalcShell and AssumptionsTable come from their concrete
 * files, never the calc barrel, whose graph reaches CalcIsland statically.
 */

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

export function ToolView({ tool, locale }: { tool: ToolDef; locale: Locale }): JSX.Element {
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
