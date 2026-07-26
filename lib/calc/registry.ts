import type { CalcId, EngineResult } from '@/lib/types';
import type { CalcEngine } from '@/lib/calc/types';
import {
  NET_PROCEEDS_ENGINE,
  clampInputs,
  fromFormValues,
} from '@/lib/calc/net-proceeds';

/**
 * Engine registry — the island resolves engineId → engine here, so the client
 * bundle contains exactly the engines that pages actually mount. One entry per
 * shipped engine; Phase 3 ships net-proceeds only (the other five are Phase 5).
 */

export type CalcFormValues = Record<string, number | string | boolean>;

export interface RegisteredCalc {
  engine: CalcEngine<unknown, EngineResult>;
  /** Display-unit form values → engine input (integer cents). Pure. */
  toInput(values: CalcFormValues): unknown;
  /** Cross-field bounds from the reference input table (e.g. payoff <= 1.5 x
   *  price) that FieldSpec cannot express statically. Pure; returns adjusted
   *  values. */
  clampCrossField?(values: CalcFormValues): CalcFormValues;
}

export const CALCS: Partial<Record<CalcId, RegisteredCalc>> = {
  'net-proceeds': {
    engine: NET_PROCEEDS_ENGINE as unknown as CalcEngine<unknown, EngineResult>,
    toInput: fromFormValues,
    clampCrossField: clampInputs,
  },
};
