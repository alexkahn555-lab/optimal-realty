import type { AssumptionSet } from '@/config/assumptions';
import type { CalcId } from '@/lib/types';

/**
 * ============================================================================
 * CALCULATOR FRAMEWORK CONTRACTS — Build reference v2.0, Part 7.4 (D9).
 * ============================================================================
 *
 * One engine contract drives the form UI, client validation, server zod, and
 * tests. FieldSpec is DATA: the island renders inputs and derives client
 * validation from it without importing zod (zod stays server-only).
 */

export interface FieldSpec {
  key: string;
  kind: 'currency' | 'percent' | 'integer' | 'date' | 'enum' | 'boolean';
  /** Static bounds in display units (dollars for currency). Relative bounds
   *  from the reference input table (e.g. payoff <= 1.5 x price) are enforced
   *  as cross-field rules in the island, not expressible per-field here. */
  min?: number;
  max?: number;
  step?: number;
  required: boolean;
  default?: number | string | boolean;
  /** Key into AssumptionSet — the UI flags the field with a footnote marker. */
  defaultFromAssumption?: string;
  enumValues?: string[];
  /** i18n dictionary key (content/ui-strings.ts) — labels are chrome, not content. */
  labelKey: string;
  helperKey?: string;
}

export interface CalcEngine<I, O> {
  id: CalcId;
  fields: FieldSpec[];
  /** Pure, deterministic, integer cents, <1ms. No Date.now(), no I/O, no
   *  locale reads — dates and formats enter as inputs. */
  compute(input: I, cfg: AssumptionSet): O;
}
