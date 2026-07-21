import { NextResponse } from 'next/server';
import type { LeadSubmission } from '@/lib/types';
import type { CrmAdapter } from '@/lib/crm/adapter';
import { MissingEnvError } from './clients';
import { leadSubmissionSchema } from './schema';

/**
 * ============================================================================
 * THE NINE-STEP LEAD PIPELINE (reference Part 9, D8: insert-first).
 * ============================================================================
 *
 *  1 zod parse (unknown keys stripped, caps = SQL, registry source) ... 400
 *  2 honeypot + time trap .......................... silent 200, nothing stored
 *  3 Turnstile siteverify .......................................... 403
 *  4 rate limit — 5/ip_hash/hour, counts EVERY attempt reaching here  429
 *  5 dedupe — email+source within 24h returns the existing id ....... 200
 *  6 insert leads + created event — the ONLY step permitted to 500
 *  7 side effects, each own try/catch, never blocking ............ events
 *  8 CrmAdapter.enqueue — non-blocking noop, row stays pending
 *  9 201 { id }
 *
 * Storage hiccups in steps 4–5 fail OPEN (log + continue): a lost lead is the
 * only unrecoverable failure, so nothing before the insert may turn a
 * recoverable error into a rejected submission. MissingEnvError anywhere maps
 * to 503 naming the variable(s) — configuration, not weather.
 */

export const TIME_TRAP_MS = 3_000;
export const RATE_LIMIT_MAX = 5;
export const RATE_LIMIT_WINDOW_MS = 3_600_000;
export const DEDUPE_WINDOW_MS = 86_400_000;

export type LeadEventType =
  | 'created'
  | 'email_broker_sent'
  | 'email_lead_sent'
  | 'sms_sent'
  | 'sms_queued'
  | 'crm_synced'
  | 'crm_failed'
  | 'status_changed'
  | 'notify_error';

/** snake_case row for the leads insert — mirrors supabase/schema.sql. */
export interface LeadInsertRow {
  locale: string;
  portal: string | null;
  source_type: string;
  source_slug: string | null;
  route: string;
  intent: string;
  full_name: string;
  email: string;
  phone: string | null;
  message: string | null;
  payload: Record<string, unknown> | null;
  utm: Record<string, string> | null;
  consent_sms: boolean;
  consent_marketing: boolean;
  consent_ts: string | null;
  ip_hash: string | null;
  user_agent: string | null;
}

/** Everything the pipeline touches arrives injected — tests mock this whole. */
export interface LeadPipelineDeps {
  now(): number;
  hashIp(ip: string): string;
  verifyTurnstile(token: string, ip?: string): Promise<boolean>;
  /** Fixed-window limiter: increment first, then report hits in the window. */
  incrementRateLimit(ipHash: string, windowStartIso: string): Promise<number>;
  findRecentDuplicate(
    email: string,
    sourceType: string,
    sourceSlug: string | undefined,
    sinceIso: string
  ): Promise<{ id: string } | null>;
  /** Insert-first: writes the lead AND its 'created' event. Throws => 500. */
  insertLead(row: LeadInsertRow): Promise<{ id: string }>;
  /** Never throws (implementation swallows its own failures). */
  logEvent(
    leadId: string,
    type: LeadEventType,
    detail?: Record<string, unknown>
  ): Promise<void>;
  sendBrokerEmail(lead: LeadSubmission, leadId: string): Promise<void>;
  sendLeadConfirmation(
    lead: LeadSubmission
  ): Promise<{ skipped?: 'tk_body' }>;
  sendSms(to: string, body: string): Promise<void>;
  crm: CrmAdapter;
}

export interface LeadRequestContext {
  ip: string | null;
  userAgent: string | null;
}

/** 21:00–08:00 America/New_York, DST-correct via Intl. Exported for tests. */
export function isQuietHoursEt(epochMs: number): boolean {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hourCycle: 'h23',
      timeZone: 'America/New_York',
    }).format(new Date(epochMs))
  );
  return hour >= 21 || hour < 8;
}

/** Success-shaped body for the silent-drop path; bots learn nothing. */
function silentDrop(reason: string): NextResponse {
  console.info(`[leads] silent drop: ${reason}`);
  return NextResponse.json({ id: crypto.randomUUID() }, { status: 200 });
}

export async function runLeadPipeline(
  body: unknown,
  ctx: LeadRequestContext,
  deps: LeadPipelineDeps
): Promise<NextResponse> {
  try {
    /* 1 — parse. Unknown keys are stripped by the schema. */
    const parsed = leadSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_submission' }, { status: 400 });
    }
    const lead = parsed.data;
    const now = deps.now();

    /* 2 — honeypot + time trap. */
    if (lead.hp !== undefined && lead.hp !== '') {
      return silentDrop('honeypot');
    }
    if (now - lead.startedAt < TIME_TRAP_MS) {
      return silentDrop('time_trap');
    }

    /* 3 — Turnstile siteverify. */
    const human = await deps.verifyTurnstile(
      lead.turnstileToken,
      ctx.ip ?? undefined
    );
    if (!human) {
      return NextResponse.json({ error: 'turnstile_failed' }, { status: 403 });
    }

    /* 4 — rate limit. Counts EVERY attempt that reaches this step. */
    const ipHash = deps.hashIp(ctx.ip ?? 'unknown');
    const windowStartMs =
      Math.floor(now / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS;
    try {
      const hits = await deps.incrementRateLimit(
        ipHash,
        new Date(windowStartMs).toISOString()
      );
      if (hits > RATE_LIMIT_MAX) {
        const retryAfter = Math.ceil(
          (windowStartMs + RATE_LIMIT_WINDOW_MS - now) / 1000
        );
        return NextResponse.json(
          { error: 'rate_limited', retryAfter },
          { status: 429, headers: { 'Retry-After': String(retryAfter) } }
        );
      }
    } catch (err) {
      if (err instanceof MissingEnvError) throw err;
      console.error('[leads] rate limiter unavailable, failing open:', err);
    }

    /* 5 — dedupe: same email + source within 24h returns the existing id. */
    try {
      const existing = await deps.findRecentDuplicate(
        lead.email.toLowerCase(),
        lead.sourceType,
        lead.sourceSlug,
        new Date(now - DEDUPE_WINDOW_MS).toISOString()
      );
      if (existing) {
        return NextResponse.json({ id: existing.id }, { status: 200 });
      }
    } catch (err) {
      if (err instanceof MissingEnvError) throw err;
      console.error('[leads] dedupe check unavailable, failing open:', err);
    }

    /* 6 — insert-first. The ONLY step permitted to return 500. */
    let leadId: string;
    try {
      const inserted = await deps.insertLead({
        locale: lead.locale,
        portal: lead.portal ?? null,
        source_type: lead.sourceType,
        source_slug: lead.sourceSlug ?? null,
        route: lead.route,
        intent: lead.intent,
        full_name: lead.fullName,
        email: lead.email,
        phone: lead.phone ?? null,
        message: lead.message ?? null,
        payload: lead.payload ?? null,
        utm: lead.utm ?? null,
        consent_sms: lead.consentSms,
        consent_marketing: lead.consentMarketing,
        consent_ts:
          lead.consentSms || lead.consentMarketing
            ? new Date(now).toISOString()
            : null,
        ip_hash: ipHash,
        user_agent: ctx.userAgent ? ctx.userAgent.slice(0, 500) : null,
      });
      leadId = inserted.id;
    } catch (err) {
      if (err instanceof MissingEnvError) throw err;
      console.error('[leads] insert failed:', err);
      return NextResponse.json({ error: 'storage_failure' }, { status: 500 });
    }

    /* 7 — side effects. Each in its own try/catch; none blocks the response. */
    try {
      await deps.sendBrokerEmail(lead, leadId);
      await deps.logEvent(leadId, 'email_broker_sent');
    } catch (err) {
      console.error('[leads] broker email failed:', err);
      await deps.logEvent(leadId, 'notify_error', {
        channel: 'broker_email',
        error: err instanceof Error ? err.message : String(err),
      });
    }

    try {
      const result = await deps.sendLeadConfirmation(lead);
      await deps.logEvent(
        leadId,
        'email_lead_sent',
        result.skipped ? { skipped: result.skipped } : undefined
      );
    } catch (err) {
      console.error('[leads] confirmation email failed:', err);
      await deps.logEvent(leadId, 'notify_error', {
        channel: 'lead_email',
        error: err instanceof Error ? err.message : String(err),
      });
    }

    /* Quiet-hours SMS branch — dormant while TWILIO_ENABLED stays '0'. */
    if (process.env.TWILIO_ENABLED === '1') {
      try {
        const to = process.env.BROKER_NOTIFY_PHONE;
        if (to) {
          if (isQuietHoursEt(now)) {
            await deps.logEvent(leadId, 'sms_queued', {
              reason: 'quiet_hours',
            });
          } else {
            await deps.sendSms(
              to,
              `New lead: ${lead.fullName} — ${lead.sourceType} (${lead.locale})`
            );
            await deps.logEvent(leadId, 'sms_sent');
          }
        }
      } catch (err) {
        console.error('[leads] sms failed:', err);
        await deps.logEvent(leadId, 'notify_error', {
          channel: 'sms',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    /* 8 — CRM enqueue: non-blocking; the row is already pending. */
    try {
      await deps.crm.enqueue(leadId);
    } catch (err) {
      console.error('[leads] crm enqueue failed:', err);
    }

    /* 9 — done. */
    return NextResponse.json({ id: leadId }, { status: 201 });
  } catch (err) {
    if (err instanceof MissingEnvError) {
      console.error('[leads] missing env:', err.variables.join(', '));
      return NextResponse.json(
        { error: 'missing_env', missing: err.variables },
        { status: 503 }
      );
    }
    console.error('[leads] unexpected failure:', err);
    return NextResponse.json({ error: 'unexpected' }, { status: 500 });
  }
}
