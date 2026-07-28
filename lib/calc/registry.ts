import type { CalcId, EngineResult } from '@/lib/types';
import type { CalcEngine } from '@/lib/calc/types';
import {
  CONDO_ASSESSMENT_ENGINE,
  fromFormValues as condoFromFormValues,
} from '@/lib/calc/condo-assessment';
import {
  NET_PROCEEDS_ENGINE,
  clampInputs,
  fromFormValues,
} from '@/lib/calc/net-proceeds';
import {
  RENTAL_CASHFLOW_ENGINE,
  fromFormValues as rentalFromFormValues,
} from '@/lib/calc/rental-cashflow';
import {
  TAX_RESET_ENGINE,
  fromFormValues as taxResetFromFormValues,
} from '@/lib/calc/tax-reset';
import {
  VACANCY_COST_ENGINE,
  fromFormValues as vacancyFromFormValues,
} from '@/lib/calc/vacancy-cost';

/**
 * Engine registry — the island resolves engineId → engine here, so the client
 * bundle contains exactly the engines that pages actually mount. One entry
 * per shipped engine: net-proceeds (Phase 3), vacancy-cost (5e),
 * rental-cashflow (5f), condo-assessment (5g), tax-reset (5h — the last
 * Phase 5 calculator; homestead portability is deferred out of Phase 5).
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
  // 5f — no clampCrossField: percent bands are absolute (0–100).
  'rental-cashflow': {
    engine: RENTAL_CASHFLOW_ENGINE as unknown as CalcEngine<unknown, EngineResult>,
    toInput: rentalFromFormValues,
  },
  // 5g — disclosure arithmetic only: no assumptions, no cross-field bounds.
  'condo-assessment': {
    engine: CONDO_ASSESSMENT_ENGINE as unknown as CalcEngine<unknown, EngineResult>,
    toInput: condoFromFormValues,
  },
  // 5h — TRIM-notice inputs; the growth limitation is the one assumption.
  'tax-reset': {
    engine: TAX_RESET_ENGINE as unknown as CalcEngine<unknown, EngineResult>,
    toInput: taxResetFromFormValues,
  },
};
