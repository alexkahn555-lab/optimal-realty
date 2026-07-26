import type { FieldSpec } from '@/lib/calc/types';
import type { CalcFormValues } from '@/lib/calc/registry';

/**
 * Result-state <-> querystring codec (Part 6.5): results serialize to the
 * querystring for sharing, with the page canonical pointing at the bare URL
 * (metaFor already canonicalizes). Pure and framework-free so the roundtrip is
 * unit-testable without a browser.
 *
 * Only values that differ from their defaults are serialized; parsing is
 * FieldSpec-validated — an out-of-range, malformed, or unknown param is dropped,
 * never trusted.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function serializeCalcState(
  fields: FieldSpec[],
  values: CalcFormValues,
  defaults: CalcFormValues
): string {
  const params = new URLSearchParams();
  for (const field of fields) {
    const value = values[field.key];
    if (value === undefined || value === defaults[field.key]) continue;
    if (field.kind === 'boolean') {
      params.set(field.key, value === true ? '1' : '0');
    } else {
      params.set(field.key, String(value));
    }
  }
  return params.toString();
}

export function parseCalcState(fields: FieldSpec[], search: string): CalcFormValues {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const out: CalcFormValues = {};
  for (const field of fields) {
    const raw = params.get(field.key);
    if (raw === null) continue;
    switch (field.kind) {
      case 'currency':
      case 'percent':
      case 'integer': {
        const n = Number(raw);
        if (!Number.isFinite(n)) break;
        if (field.min !== undefined && n < field.min) break;
        if (field.max !== undefined && n > field.max) break;
        out[field.key] = field.kind === 'integer' ? Math.round(n) : n;
        break;
      }
      case 'date': {
        if (ISO_DATE.test(raw)) out[field.key] = raw;
        break;
      }
      case 'enum': {
        if (field.enumValues?.includes(raw)) out[field.key] = raw;
        break;
      }
      case 'boolean': {
        if (raw === '1' || raw === '0') out[field.key] = raw === '1';
        break;
      }
    }
  }
  return out;
}
