import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { createHash } from 'node:crypto';

/**
 * ============================================================================
 * PROVIDER CLIENTS — lazy env, injected everywhere, no module-scope assertions.
 * ============================================================================
 *
 * NO LIVE CREDENTIALS EXIST during Phase 2. Therefore every provider here is
 * constructed at CALL TIME from env read at call time. Importing this module
 * with zero provider env set must never throw — `npm run build` runs with an
 * empty .env and stays green. A handler that reaches a client without its env
 * catches MissingEnvError and answers 503 naming the variable(s).
 *
 * The service-role key is server-only by lint rule: any NEXT_PUBLIC_-prefixed
 * spelling of it fails eslint (see eslint.config.mjs), so it is unreachable
 * from a client bundle by construction.
 */

export class MissingEnvError extends Error {
  readonly variables: string[];

  constructor(variables: string[]) {
    super(`Missing required environment: ${variables.join(', ')}`);
    this.name = 'MissingEnvError';
    this.variables = variables;
  }
}

/** Read env vars at call time; throw MissingEnvError naming ALL absent ones. */
export function requireEnv<const N extends readonly string[]>(
  ...names: N
): { [K in keyof N]: string } {
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length > 0) throw new MissingEnvError(missing);
  return names.map((n) => process.env[n]) as { [K in keyof N]: string };
}

/** Service-role Supabase client. Single-writer: only route handlers call this. */
export function getSupabase(): SupabaseClient {
  const [url, key] = requireEnv('SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getResend(): Resend {
  const [apiKey] = requireEnv('RESEND_API_KEY');
  return new Resend(apiKey);
}

/** Cloudflare Turnstile server-side siteverify. */
export async function verifyTurnstile(
  token: string,
  ip?: string
): Promise<boolean> {
  const [secret] = requireEnv('TURNSTILE_SECRET');
  const form = new URLSearchParams({ secret, response: token });
  if (ip) form.set('remoteip', ip);
  try {
    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: form,
      }
    );
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    // Verification unreachable = verification failed (fail closed, never 500).
    return false;
  }
}

/**
 * sha256(ip + LEAD_IP_SALT). The raw IP is never stored and never logged;
 * this hash is the only identifier that touches the database.
 */
export function hashIp(ip: string): string {
  const [salt] = requireEnv('LEAD_IP_SALT');
  return createHash('sha256').update(ip + salt).digest('hex');
}

/**
 * SMS client stub. The Twilio SDK is deliberately NOT a dependency this phase;
 * the quiet-hours branch exists behind TWILIO_ENABLED=0 and exercises this
 * interface only. Phase 6 replaces the stub body with real delivery.
 */
export interface SmsClient {
  send(to: string, body: string): Promise<void>;
}

export function getSmsClient(): SmsClient {
  requireEnv('TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM');
  return {
    async send() {
      // Stub: env is validated above; delivery wiring is a Phase 6 deliverable.
    },
  };
}
