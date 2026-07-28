import type { CalcId, EngineResult } from '@/lib/types';
import type { CalcEngine } from '@/lib/calc/types';
import {
  NET_PROCEEDS_ENGINE,
  clampInputs,
  fromFormValues,
} from '@/lib/calc/net-proceeds';
import {
  VACANCY_COST_ENGINE,
  fromFormValues as vacancyFromFormValues,
} from '@/lib/calc/vacancy-cost';

/**
 * Engine registry — the island resolves engineId → engine here, so the client
 * bundle contains exactly the engines that pages actually mount. One entry per
 * shipped engine: net-proceeds (Phase 3) and vacancy-cost (5e); the remaining
 * four are separate dispatches.
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
  // 5e — no clampCrossField: the vacancy inputs carry no relative bounds.
  'vacancy-cost': {
    engine: VACANCY_COST_ENGINE as unknown as CalcEngine<unknown, EngineResult>,
    toInput: vacancyFromFormValues,
  },
};
