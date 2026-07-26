'use client';

import { UI } from '@/content/ui-strings';
import { t } from '@/lib/i18n';
import type { CalcFormValues } from '@/lib/calc/registry';
import type { FieldSpec } from '@/lib/calc/types';
import type { Locale } from '@/lib/types';

import { ENUM_LABEL, uiString } from './labels';

/**
 * FieldSpec-driven form inputs. Underlined, never boxed (Part 1.3). Labels and
 * helpers resolve from the ui-strings dictionary — this file authors NO
 * client-facing string. Assumption-backed defaults carry a footnote marker
 * pointing at the flagged-default legend.
 */

export interface CalcFieldsProps {
  fields: FieldSpec[];
  values: CalcFormValues;
  locale: Locale;
  onChange(key: string, value: number | string | boolean): void;
}

const inputClasses =
  'w-full border-0 border-b border-hair bg-transparent font-mono text-base tabular-nums text-ink focus:border-marine focus:outline-none';
const labelClasses = 'font-mono text-xs uppercase tracking-wide text-marine';
const helperClasses = 'font-sans text-xs text-marine';

export function CalcFields({
  fields,
  values,
  locale,
  onChange,
}: CalcFieldsProps): JSX.Element {
  const hasFlagged = fields.some((f) => f.defaultFromAssumption !== undefined);

  return (
    <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
      {fields.map((field) => {
        const id = `calc-${field.key}`;
        const label = t(uiString(field.labelKey), locale);
        const flag = field.defaultFromAssumption ? ' †' : '';

        if (field.kind === 'boolean') {
          return (
            <label
              key={field.key}
              className="flex items-center gap-3 font-sans text-sm text-ink md:col-span-1"
              htmlFor={id}
            >
              <input
                checked={values[field.key] === true}
                id={id}
                name={field.key}
                onChange={(e) => onChange(field.key, e.target.checked)}
                type="checkbox"
              />
              <span>
                {label}
                {flag}
              </span>
            </label>
          );
        }

        return (
          <div key={field.key}>
            <label className={labelClasses} htmlFor={id}>
              {label}
              {flag}
            </label>
            {field.kind === 'enum' ? (
              <select
                className={inputClasses}
                id={id}
                name={field.key}
                onChange={(e) => onChange(field.key, e.target.value)}
                value={String(values[field.key] ?? '')}
              >
                {(field.enumValues ?? []).map((option) => (
                  <option key={option} value={option}>
                    {ENUM_LABEL[option] ? t(ENUM_LABEL[option]!, locale) : option}
                  </option>
                ))}
              </select>
            ) : field.kind === 'date' ? (
              <input
                className={inputClasses}
                id={id}
                name={field.key}
                onChange={(e) => onChange(field.key, e.target.value)}
                type="date"
                value={String(values[field.key] ?? '')}
              />
            ) : (
              <input
                className={inputClasses}
                id={id}
                inputMode="decimal"
                max={field.max}
                min={field.min}
                name={field.key}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  onChange(field.key, Number.isFinite(n) ? n : 0);
                }}
                step={field.step}
                type="number"
                value={String(values[field.key] ?? '')}
              />
            )}
            {field.helperKey ? (
              <p className={helperClasses}>{t(uiString(field.helperKey), locale)}</p>
            ) : null}
          </div>
        );
      })}
      {hasFlagged ? (
        <p className="font-sans text-xs text-marine md:col-span-2">
          {`† ${t(UI.calcHelper.flaggedDefault, locale)}`}
        </p>
      ) : null}
    </div>
  );
}
