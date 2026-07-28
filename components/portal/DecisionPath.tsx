import { UI } from '@/content/ui-strings';
import { t } from '@/lib/i18n';
import { PlaceholderTK } from '@/components/seo';
import { Heading, Prose } from '@/components/primitives';
import type { Locale, Localized, Portal } from '@/lib/types';

/**
 * DECISION PATH (Part 7.2 slot 6) — 3–5 steps on hairlines with mono numerals,
 * no boxes (Part 1.3). The `decision` line (the ONE decision this portal
 * supports) is broker-authored and gated to a placeholder until supplied; the
 * steps themselves are structural scaffolding and always render.
 */

export interface DecisionPathProps {
  steps: Portal['decisionSteps'];
  decision: Localized;
  locale: Locale;
}

const TK = /\bTK_/;
const isTK = (value: Localized): boolean => TK.test(value.en) || TK.test(value.es);

export function DecisionPath({
  steps,
  decision,
  locale,
}: DecisionPathProps): JSX.Element | null {
  if (steps.length === 0) return null;

  return (
    <section>
      <Heading level={2}>{t(UI.sections.decisionHeading, locale)}</Heading>
      <div className="mt-4">
        {isTK(decision) ? (
          <PlaceholderTK id={decision.en.replace(TK, '')} />
        ) : (
          <Prose>{t(decision, locale)}</Prose>
        )}
      </div>
      <ol className="mt-6">
        {steps.map((step, index) => (
          <li key={step.label.en} className="flex gap-6 border-b border-hair py-5">
            <span
              aria-hidden="true"
              className="font-mono text-sm tabular-nums text-teal"
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <p className="font-display text-lg text-ink">
                {t(step.label, locale)}
              </p>
              <p className="mt-1 max-w-prose font-sans text-sm text-ink">
                {t(step.detail, locale)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
