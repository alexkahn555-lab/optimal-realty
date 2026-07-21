import type { Resend } from 'resend';
import type { Locale, LeadSubmission } from '@/lib/types';
import { ENTITY, LICENSE_LABEL } from '@/config/entity';
import { LEAD_CONFIRM_EMAIL } from '@/content/emails';
import { requireEnv } from './clients';

/**
 * ============================================================================
 * LEAD NOTIFICATIONS — broker alert + lead confirmation.
 * ============================================================================
 *
 * Both are SIDE EFFECTS of the pipeline: each runs in its own try/catch after
 * the lead row is committed, and no failure here may block the 201.
 *
 * Broker email: internal operational copy, EN, plain text — every field the
 * broker needs to act, plus the full source chain for attribution.
 *
 * Lead confirmation: locale-matched, transactional (NOT gated on
 * consent_marketing). The body lives in content/emails.ts in the client's
 * voice; while it still carries a placeholder marker the send is SKIPPED and
 * the skip is recorded on the event chain. Real people never receive
 * placeholder text.
 */

const TK = /\bTK_/;

/* ---- Signature (from entity, unconfirmed fields omitted) ------------------ */

function signatureLines(): string[] {
  const { entity } = ENTITY;
  const lines: string[] = [entity.tradeName];
  for (const license of entity.licenses) {
    lines.push(`${LICENSE_LABEL[license.role]} ${license.number}`);
  }
  if (!TK.test(entity.phone)) lines.push(entity.phone);
  if (!TK.test(entity.email)) lines.push(entity.email);
  if (!TK.test(entity.address.line1)) {
    lines.push(
      `${entity.address.line1}, ${entity.address.city}, ${entity.address.state} ${entity.address.zip}`
    );
  }
  return lines;
}

/* ---- Lead confirmation ----------------------------------------------------- */

export type LeadConfirmRender =
  | { skipped: 'tk_body' }
  | { skipped?: undefined; subject: string; text: string };

/** Pure render — exported so tests can assert the skip without a client. */
export function renderLeadConfirmEmail(
  fullName: string,
  locale: Locale
): LeadConfirmRender {
  const body = LEAD_CONFIRM_EMAIL.body[locale];
  if (TK.test(body)) return { skipped: 'tk_body' };

  const firstName = fullName.trim().split(/\s+/)[0] ?? fullName;
  const text = [
    `${LEAD_CONFIRM_EMAIL.greeting[locale]} ${firstName},`,
    '',
    body,
    '',
    '—',
    ...signatureLines(),
  ].join('\n');

  return { subject: LEAD_CONFIRM_EMAIL.subject[locale], text };
}

/**
 * Send the confirmation to the stored lead. Returns the skip disposition so
 * the pipeline can log it. The marker check runs BEFORE env is read: a
 * placeholder body skips cleanly even on a fully provisioned deployment.
 */
export async function sendLeadConfirmation(
  resend: Resend,
  lead: Pick<LeadSubmission, 'fullName' | 'email' | 'locale'>
): Promise<{ skipped: 'tk_body' } | { skipped?: undefined }> {
  const rendered = renderLeadConfirmEmail(lead.fullName, lead.locale);
  if (rendered.skipped) return { skipped: rendered.skipped };

  const [from] = requireEnv('LEAD_FROM_ADDRESS');
  const { error } = await resend.emails.send({
    from,
    to: lead.email,
    subject: rendered.subject,
    text: rendered.text,
  });
  if (error) throw new Error(`resend: ${error.message}`);
  return {};
}

/* ---- Broker notification ---------------------------------------------------- */

function kv(label: string, value: string | undefined | null): string {
  return `  ${label.padEnd(14)}${value && value.length > 0 ? value : '—'}`;
}

/** Pure render — internal operational copy, EN only, plain text. */
export function renderBrokerEmail(
  lead: LeadSubmission,
  leadId: string
): { subject: string; text: string } {
  const source = lead.sourceSlug
    ? `${lead.sourceType}/${lead.sourceSlug}`
    : lead.sourceType;
  const subject = `New lead: ${lead.fullName} — ${source} (${lead.locale})`;

  const utm =
    lead.utm && Object.keys(lead.utm).length > 0
      ? Object.entries(lead.utm)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ')
      : undefined;

  const payloadLines =
    lead.payload && Object.keys(lead.payload).length > 0
      ? Object.entries(lead.payload).map(
          ([k, v]) => `  ${k.padEnd(24)}${JSON.stringify(v)}`
        )
      : ['  —'];

  const text = [
    `New lead — ${lead.fullName} (${lead.intent})`,
    '',
    'Lead',
    kv('Name', lead.fullName),
    kv('Email', lead.email),
    kv('Phone', lead.phone),
    kv('Locale', lead.locale),
    kv('Message', lead.message ? `\n    ${lead.message.replace(/\n/g, '\n    ')}` : undefined),
    '',
    'Source chain',
    kv('Portal', lead.portal),
    kv('Source type', lead.sourceType),
    kv('Source slug', lead.sourceSlug),
    kv('Route', lead.route),
    kv('UTM', utm),
    '',
    'Payload',
    ...payloadLines,
    '',
    'Consent',
    kv('SMS', lead.consentSms ? 'yes' : 'no'),
    kv('Marketing', lead.consentMarketing ? 'yes' : 'no'),
    '',
    `Lead id: ${leadId}`,
  ].join('\n');

  return { subject, text };
}

export async function sendBrokerEmail(
  resend: Resend,
  lead: LeadSubmission,
  leadId: string
): Promise<void> {
  const [from, to] = requireEnv('LEAD_FROM_ADDRESS', 'BROKER_NOTIFY_EMAIL');
  const rendered = renderBrokerEmail(lead, leadId);
  const { error } = await resend.emails.send({
    from,
    to,
    subject: rendered.subject,
    text: rendered.text,
  });
  if (error) throw new Error(`resend: ${error.message}`);
}
