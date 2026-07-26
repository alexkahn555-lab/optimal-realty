'use client';

import { useEffect, useMemo, useState } from 'react';

import { CALCS } from '@/lib/calc/registry';
import type { CalcFormValues } from '@/lib/calc/registry';
import type { FieldSpec } from '@/lib/calc/types';
import type { CalcId, EngineResult, LeadIntent, Locale } from '@/lib/types';
import { ASSUMPTIONS } from '@/config/assumptions';

import { CalcFields } from './CalcFields';
import { ResultPanel } from './ResultPanel';
import { parseCalcState, serializeCalcState } from './query';

/**
 * THE CALCULATOR ISLAND (<= 25 KB gz, budget-enforced in tests). Owns form
 * state, live recompute through the pure engine, and result-state -> querystring
 * serialization (canonical stays the bare URL via metaFor). Client validation
 * derives from FieldSpec DATA — zod never enters this bundle.
 */

export interface CalcIslandProps {
  engineId: CalcId;
  locale: Locale;
  /** Tool slug for lead attribution { sourceType: 'tool', sourceSlug }. */
  sourceSlug: string;
  leadIntent: LeadIntent;
  /** Serializable FieldSpec[] passed from the server shell. */
  fields: FieldSpec[];
  /** Server-resolved defaults (assumption-backed ones already substituted). */
  defaults: CalcFormValues;
}

/** Required fields present and inside their FieldSpec bounds? */
function isComputable(fields: FieldSpec[], values: CalcFormValues): boolean {
  for (const field of fields) {
    if (!field.required) continue;
    const value = values[field.key];
    if (field.kind === 'date') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''))) return false;
    } else if (field.kind === 'enum') {
      if (!field.enumValues?.includes(String(value))) return false;
    } else if (field.kind === 'boolean') {
      if (typeof value !== 'boolean') return false;
    } else {
      const n = Number(value);
      if (!Number.isFinite(n)) return false;
      if (field.min !== undefined && n < field.min) return false;
      if (field.max !== undefined && n > field.max) return false;
    }
  }
  return true;
}

export function CalcIsland({
  engineId,
  locale,
  sourceSlug,
  leadIntent,
  fields,
  defaults,
}: CalcIslandProps): JSX.Element | null {
  const calc = CALCS[engineId];
  const [values, setValues] = useState<CalcFormValues>(defaults);
  const [hydrated, setHydrated] = useState(false);

  // Mount: merge shared-result querystring state, then fill the closing-date
  // default (today + 45d) from the client clock — client-side only, so the
  // engine stays deterministic and hydration never mismatches.
  useEffect(() => {
    const fromQuery = parseCalcState(fields, window.location.search);
    setValues((prev) => {
      const next = { ...prev, ...fromQuery };
      const dateField = fields.find((f) => f.kind === 'date');
      if (dateField && !next[dateField.key]) {
        const plus45 = new Date(Date.now() + 45 * 86_400_000);
        next[dateField.key] = plus45.toISOString().slice(0, 10);
      }
      return next;
    });
    setHydrated(true);
  }, []);

  // Live recompute: cross-field clamps, then the pure engine. Same cents as the
  // server for the same inputs — that is the whole point of the purity rule.
  const result: EngineResult | null = useMemo(() => {
    if (!calc || !isComputable(fields, values)) return null;
    const clamped = calc.clampCrossField ? calc.clampCrossField(values) : values;
    return calc.engine.compute(calc.toInput(clamped), ASSUMPTIONS);
  }, [calc, fields, values]);

  // Result state -> querystring (replaceState so history stays clean).
  useEffect(() => {
    if (!hydrated) return;
    const query = serializeCalcState(fields, values, defaults);
    const url = query
      ? `${window.location.pathname}?${query}`
      : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [hydrated, fields, values, defaults]);

  if (!calc) return null;

  return (
    <div className="space-y-10">
      <CalcFields
        fields={fields}
        values={values}
        locale={locale}
        onChange={(key, value) => setValues((prev) => ({ ...prev, [key]: value }))}
      />
      <ResultPanel
        result={result}
        locale={locale}
        values={values}
        sourceSlug={sourceSlug}
        leadIntent={leadIntent}
      />
    </div>
  );
}
