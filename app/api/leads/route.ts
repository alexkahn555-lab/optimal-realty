import { NextResponse, type NextRequest } from 'next/server';
import { getCrmAdapter } from '@/lib/crm/adapter';
import {
  getResend,
  getSmsClient,
  hashIp,
  MissingEnvError,
  requireEnv,
  verifyTurnstile,
} from '@/lib/leads/clients';
import { sendBrokerEmail, sendLeadConfirmation } from '@/lib/leads/notify';
import {
  runLeadPipeline,
  type LeadPipelineDeps,
} from '@/lib/leads/pipeline';
import {
  findRecentDuplicate,
  incrementRateLimit,
  insertLead,
  logEvent,
} from '@/lib/leads/store';

/**
 * POST /api/leads — the single writer for the lead tables.
 *
 * This file is a thin binding: the nine-step contract lives in
 * lib/leads/pipeline.ts with every provider injected, so unit tests exercise
 * the full contract with mocks and this module contains nothing to mock.
 * All env is read at call time; importing this module with zero provider env
 * set is side-effect free and `npm run build` stays green.
 */

const REQUIRED_ENV = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'TURNSTILE_SECRET',
  'LEAD_IP_SALT',
] as const;

/** First client IP from proxy headers. Never stored, never logged. */
function clientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip');
}

function realDeps(): LeadPipelineDeps {
  return {
    now: () => Date.now(),
    hashIp,
    verifyTurnstile,
    incrementRateLimit,
    findRecentDuplicate,
    insertLead,
    logEvent,
    sendBrokerEmail: (lead, leadId) =>
      sendBrokerEmail(getResend(), lead, leadId),
    sendLeadConfirmation: (lead) => sendLeadConfirmation(getResend(), lead),
    sendSms: (to, body) => getSmsClient().send(to, body),
    crm: getCrmAdapter(),
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Pre-flight: name every missing handler-required variable in one 503.
    requireEnv(...REQUIRED_ENV);

    const body: unknown = await request.json().catch(() => null);
    return await runLeadPipeline(
      body,
      {
        ip: clientIp(request),
        userAgent: request.headers.get('user-agent'),
      },
      realDeps()
    );
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
