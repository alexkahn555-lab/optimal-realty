'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

import { UI } from '@/content/ui-strings';
import { LEAD_FIELD_SPEC } from '@/lib/leads/fields';
import { t } from '@/lib/i18n';
import type {
  LeadIntent,
  LeadSourceType,
  LeadSubmission,
  Locale,
  PortalId,
} from '@/lib/types';

import { TurnstileLazy } from './TurnstileLazy';
import { readStoredUtm } from './utm';

type FieldErrors = Partial<Record<'fullName' | 'email' | 'phone', string>>;
type Status = 'idle' | 'submitting' | 'success' | 'error';

export interface LeadFormProps {
  locale: Locale;
  sourceType: LeadSourceType;
  sourceSlug?: string;
  portal?: PortalId;
  intent?: LeadIntent;
}

const inputClasses =
  'w-full border-0 border-b border-hair bg-transparent font-sans text-base text-ink focus:border-marine focus:outline-none';
const labelClasses = 'font-mono text-xs uppercase tracking-wide text-marine';
const errorClasses = 'font-mono text-xs text-coral';

export function LeadForm(props: LeadFormProps): JSX.Element {
  const { locale, portal, sourceSlug, sourceType } = props;
  const [status, setStatus] = useState<Status>('idle');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [token, setToken] = useState('');
  const [startedAt] = useState(() => Date.now());

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) ?? '');
    const fullName = value('fullName').slice(0, LEAD_FIELD_SPEC.fullName.maxLength);
    const email = value('email').slice(0, LEAD_FIELD_SPEC.email.maxLength);
    const phone = value('phone').slice(0, LEAD_FIELD_SPEC.phone.maxLength);
    const message = value('message').slice(0, LEAD_FIELD_SPEC.message.maxLength);
    const errors: FieldErrors = {};

    if (
      (LEAD_FIELD_SPEC.fullName.required && !fullName) ||
      (LEAD_FIELD_SPEC.fullName.minLength !== undefined &&
        fullName.length < LEAD_FIELD_SPEC.fullName.minLength)
    ) {
      errors.fullName = t(UI.form.requiredError, locale);
    }
    if (LEAD_FIELD_SPEC.email.required && !email) {
      errors.email = t(UI.form.requiredError, locale);
    } else if (
      LEAD_FIELD_SPEC.email.pattern &&
      !new RegExp(LEAD_FIELD_SPEC.email.pattern).test(email)
    ) {
      errors.email = t(UI.form.emailError, locale);
    }
    if (
      phone &&
      ((LEAD_FIELD_SPEC.phone.minLength !== undefined &&
        phone.length < LEAD_FIELD_SPEC.phone.minLength) ||
        (LEAD_FIELD_SPEC.phone.pattern &&
          !new RegExp(LEAD_FIELD_SPEC.phone.pattern).test(phone)))
    ) {
      errors.phone = t(UI.form.phoneError, locale);
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const utm = readStoredUtm();
    const body: LeadSubmission = {
      locale,
      ...(portal === undefined ? {} : { portal }),
      sourceType,
      ...(sourceSlug === undefined ? {} : { sourceSlug }),
      route: window.location.pathname,
      intent: props.intent ?? 'general',
      fullName,
      email,
      ...(phone ? { phone } : {}),
      ...(message ? { message } : {}),
      ...(utm === undefined ? {} : { utm }),
      consentSms: data.get('consentSms') !== null,
      consentMarketing: data.get('consentMarketing') !== null,
      turnstileToken: token,
      hp: value('hp'),
      startedAt,
    };

    setStatus('submitting');
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      setStatus(response.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="space-y-4" role="status">
        <h2 className="font-display text-2xl text-ink">
          {t(UI.form.successHeading, locale)}
        </h2>
        <p className="font-sans text-base text-ink">
          {t(UI.form.successBody, locale)}
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-8" noValidate onSubmit={handleSubmit}>
      <div>
        <label className={labelClasses} htmlFor="lead-full-name">
          {t(UI.form.fullName, locale)}
        </label>
        <input
          aria-describedby={fieldErrors.fullName ? 'lead-full-name-error' : undefined}
          aria-invalid={fieldErrors.fullName ? true : undefined}
          className={inputClasses}
          id="lead-full-name"
          maxLength={LEAD_FIELD_SPEC.fullName.maxLength}
          name="fullName"
          required={LEAD_FIELD_SPEC.fullName.required}
        />
        {fieldErrors.fullName && (
          <p className={errorClasses} id="lead-full-name-error">
            {fieldErrors.fullName}
          </p>
        )}
      </div>

      <div>
        <label className={labelClasses} htmlFor="lead-email">
          {t(UI.form.email, locale)}
        </label>
        <input
          aria-describedby={fieldErrors.email ? 'lead-email-error' : undefined}
          aria-invalid={fieldErrors.email ? true : undefined}
          className={inputClasses}
          id="lead-email"
          inputMode="email"
          maxLength={LEAD_FIELD_SPEC.email.maxLength}
          name="email"
          required={LEAD_FIELD_SPEC.email.required}
          type="email"
        />
        {fieldErrors.email && (
          <p className={errorClasses} id="lead-email-error">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div>
        <label className={labelClasses} htmlFor="lead-phone">
          {t(UI.form.phone, locale)} <span>{t(UI.form.optional, locale)}</span>
        </label>
        <input
          aria-describedby={fieldErrors.phone ? 'lead-phone-error' : undefined}
          aria-invalid={fieldErrors.phone ? true : undefined}
          className={inputClasses}
          id="lead-phone"
          inputMode="tel"
          maxLength={LEAD_FIELD_SPEC.phone.maxLength}
          name="phone"
          type="tel"
        />
        {fieldErrors.phone && (
          <p className={errorClasses} id="lead-phone-error">
            {fieldErrors.phone}
          </p>
        )}
      </div>

      <div>
        <label className={labelClasses} htmlFor="lead-message">
          {t(UI.form.message, locale)} <span>{t(UI.form.optional, locale)}</span>
        </label>
        <textarea
          className={inputClasses}
          id="lead-message"
          maxLength={LEAD_FIELD_SPEC.message.maxLength}
          name="message"
          rows={4}
        />
      </div>

      <div className="sr-only" aria-hidden="true">
        <label htmlFor="lead-hp">{t(UI.form.hpLabel, locale)}</label>
        <input id="lead-hp" name="hp" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="space-y-4 border-t border-hair pt-6">
        <label className="flex gap-3 font-sans text-sm text-ink">
          <input name="consentSms" type="checkbox" />
          <span>{t(UI.form.consentSms, locale)}</span>
        </label>
        <label className="flex gap-3 font-sans text-sm text-ink">
          <input name="consentMarketing" type="checkbox" />
          <span>{t(UI.form.consentMarketing, locale)}</span>
        </label>
      </div>

      <TurnstileLazy locale={locale} onToken={setToken} />

      <div>
        {status === 'error' && (
          <p className={`${errorClasses} mb-4`} role="alert">
            {t(UI.form.errorBody, locale)}
          </p>
        )}
        <button
          className="border-b border-marine pb-0.5 font-mono text-sm uppercase tracking-wide text-marine disabled:opacity-50"
          disabled={status === 'submitting'}
          type="submit"
        >
          {t(status === 'submitting' ? UI.form.sending : UI.form.submit, locale)}
        </button>
      </div>
    </form>
  );
}
