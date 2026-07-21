import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LeadPipelineDeps } from '@/lib/leads/pipeline';
import {
  isQuietHoursEt,
  runLeadPipeline,
  RATE_LIMIT_MAX,
} from '@/lib/leads/pipeline';
import { hashIp, MissingEnvError, requireEnv } from '@/lib/leads/clients';

/**
 * The nine-step contract, certified branch by branch with fully mocked deps.
 * Nothing in this file performs network or database I/O.
 */

const NOW = 1_790_000_000_000; // fixed epoch for determinism

const CTX = { ip: '203.0.113.7', userAgent: 'vitest' };

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    locale: 'en',
    sourceType: 'contact',
    route: '/en/contact',
    intent: 'general',
    fullName: 'Test Person',
    email: 'lead@example.com',
    consentSms: false,
    consentMarketing: false,
    turnstileToken: 'tok-123',
    hp: '',
    startedAt: NOW - 10_000,
    ...overrides,
  };
}

function mockDeps(overrides: Partial<LeadPipelineDeps> = {}): LeadPipelineDeps {
  return {
    now: () => NOW,
    hashIp: vi.fn((ip: string) => `hash(${ip})`),
    verifyTurnstile: vi.fn(async () => true),
    incrementRateLimit: vi.fn(async () => 1),
    findRecentDuplicate: vi.fn(async () => null),
    insertLead: vi.fn(async () => ({ id: 'lead-1' })),
    logEvent: vi.fn(async () => undefined),
    sendBrokerEmail: vi.fn(async () => undefined),
    sendLeadConfirmation: vi.fn(async () => ({})),
    sendSms: vi.fn(async () => undefined),
    crm: { provider: 'null', enqueue: vi.fn(async () => undefined), upsert: vi.fn() },
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

/* ---- 1: parse ------------------------------------------------------------- */

describe('step 1 — parse', () => {
  it('rejects a malformed email with 400', async () => {
    const deps = mockDeps();
    const res = await runLeadPipeline(
      validBody({ email: 'not-an-email' }),
      CTX,
      deps
    );
    expect(res.status).toBe(400);
    expect(deps.verifyTurnstile).not.toHaveBeenCalled();
    expect(deps.insertLead).not.toHaveBeenCalled();
  });

  it('rejects an unregistered source (tool slug with empty registry) with 400', async () => {
    const res = await runLeadPipeline(
      validBody({ sourceType: 'tool', sourceSlug: 'net-proceeds' }),
      CTX,
      mockDeps()
    );
    expect(res.status).toBe(400);
  });

  it('strips unknown keys before anything downstream sees them', async () => {
    const deps = mockDeps();
    const res = await runLeadPipeline(
      validBody({ admin: true, status: 'client', ip_hash: 'forged' }),
      CTX,
      deps
    );
    expect(res.status).toBe(201);
    const row = vi.mocked(deps.insertLead).mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(row).toBeDefined();
    expect('admin' in row).toBe(false);
    expect(row.status).toBeUndefined();
    // ip_hash comes from the pipeline's own hashing, never the payload.
    expect(row.ip_hash).toBe('hash(203.0.113.7)');
  });
});

/* ---- 2: honeypot + time trap ---------------------------------------------- */

describe('step 2 — honeypot + time trap', () => {
  it('honeypot content silently drops: success-shaped 200, nothing stored', async () => {
    const deps = mockDeps();
    const res = await runLeadPipeline(validBody({ hp: 'gotcha' }), CTX, deps);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string };
    expect(body.id).toMatch(/^[0-9a-f-]{36}$/); // plausible, fabricated
    expect(deps.verifyTurnstile).not.toHaveBeenCalled();
    expect(deps.incrementRateLimit).not.toHaveBeenCalled();
    expect(deps.insertLead).not.toHaveBeenCalled();
    expect(deps.logEvent).not.toHaveBeenCalled();
  });

  it('sub-3s submission silently drops with the same shape', async () => {
    const deps = mockDeps();
    const res = await runLeadPipeline(
      validBody({ startedAt: NOW - 1_000 }),
      CTX,
      deps
    );
    expect(res.status).toBe(200);
    expect((await res.json()).id).toMatch(/^[0-9a-f-]{36}$/);
    expect(deps.insertLead).not.toHaveBeenCalled();
  });
});

/* ---- 3: turnstile ---------------------------------------------------------- */

describe('step 3 — turnstile', () => {
  it('failed verification returns 403 and never reaches the limiter', async () => {
    const deps = mockDeps({ verifyTurnstile: vi.fn(async () => false) });
    const res = await runLeadPipeline(validBody(), CTX, deps);
    expect(res.status).toBe(403);
    expect(deps.incrementRateLimit).not.toHaveBeenCalled();
    expect(deps.insertLead).not.toHaveBeenCalled();
  });
});

/* ---- 4: rate limit ---------------------------------------------------------- */

describe('step 4 — rate limit', () => {
  it(`blocks past ${RATE_LIMIT_MAX}/window with 429 + retryAfter`, async () => {
    const deps = mockDeps({ incrementRateLimit: vi.fn(async () => 6) });
    const res = await runLeadPipeline(validBody(), CTX, deps);
    expect(res.status).toBe(429);
    const body = (await res.json()) as { retryAfter: number };
    expect(body.retryAfter).toBeGreaterThan(0);
    expect(body.retryAfter).toBeLessThanOrEqual(3600);
    expect(res.headers.get('Retry-After')).toBe(String(body.retryAfter));
    expect(deps.insertLead).not.toHaveBeenCalled();
  });

  it('counts attempts that later fail (insert failure still incremented)', async () => {
    const deps = mockDeps({
      insertLead: vi.fn(async () => {
        throw new Error('db down');
      }),
    });
    const res = await runLeadPipeline(validBody(), CTX, deps);
    expect(res.status).toBe(500);
    expect(deps.incrementRateLimit).toHaveBeenCalledTimes(1);
  });

  it('counts attempts that dedupe away (existing id still incremented)', async () => {
    const deps = mockDeps({
      findRecentDuplicate: vi.fn(async () => ({ id: 'prior' })),
    });
    const res = await runLeadPipeline(validBody(), CTX, deps);
    expect(res.status).toBe(200);
    expect(deps.incrementRateLimit).toHaveBeenCalledTimes(1);
  });

  it('fails open when the limiter store is unavailable', async () => {
    const deps = mockDeps({
      incrementRateLimit: vi.fn(async () => {
        throw new Error('transient');
      }),
    });
    const res = await runLeadPipeline(validBody(), CTX, deps);
    expect(res.status).toBe(201);
  });
});

/* ---- 5: dedupe --------------------------------------------------------------- */

describe('step 5 — dedupe', () => {
  it('returns the existing id with 200 and does not re-insert', async () => {
    const deps = mockDeps({
      findRecentDuplicate: vi.fn(async () => ({ id: 'existing-42' })),
    });
    const res = await runLeadPipeline(validBody(), CTX, deps);
    expect(res.status).toBe(200);
    expect((await res.json()).id).toBe('existing-42');
    expect(deps.insertLead).not.toHaveBeenCalled();
    expect(deps.sendBrokerEmail).not.toHaveBeenCalled();
  });

  it('queries with the lowercased email', async () => {
    const deps = mockDeps();
    await runLeadPipeline(validBody({ email: 'MiXeD@Example.COM' }), CTX, deps);
    expect(vi.mocked(deps.findRecentDuplicate).mock.calls[0]?.[0]).toBe(
      'mixed@example.com'
    );
  });
});

/* ---- 6: insert-first ----------------------------------------------------------- */

describe('step 6 — insert (the only 500)', () => {
  it('insert failure returns 500 and NO side effects fire', async () => {
    const deps = mockDeps({
      insertLead: vi.fn(async () => {
        throw new Error('constraint violation');
      }),
    });
    const res = await runLeadPipeline(validBody(), CTX, deps);
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('storage_failure');
    expect(deps.sendBrokerEmail).not.toHaveBeenCalled();
    expect(deps.sendLeadConfirmation).not.toHaveBeenCalled();
    expect(deps.sendSms).not.toHaveBeenCalled();
    expect(deps.crm.enqueue).not.toHaveBeenCalled();
    expect(deps.logEvent).not.toHaveBeenCalled();
  });

  it('stamps consent_ts only when a consent box is checked', async () => {
    const deps = mockDeps();
    await runLeadPipeline(validBody(), CTX, deps);
    let row = vi.mocked(deps.insertLead).mock.calls[0]?.[0];
    expect(row?.consent_ts).toBeNull();

    const deps2 = mockDeps();
    await runLeadPipeline(validBody({ consentSms: true }), CTX, deps2);
    row = vi.mocked(deps2.insertLead).mock.calls[0]?.[0];
    expect(row?.consent_ts).toBe(new Date(NOW).toISOString());
  });
});

/* ---- 7: side effects --------------------------------------------------------------- */

describe('step 7 — side effects never block', () => {
  it('broker email throw still returns 201 and logs notify_error', async () => {
    const deps = mockDeps({
      sendBrokerEmail: vi.fn(async () => {
        throw new Error('resend: quota');
      }),
    });
    const res = await runLeadPipeline(validBody(), CTX, deps);
    expect(res.status).toBe(201);
    expect(deps.logEvent).toHaveBeenCalledWith('lead-1', 'notify_error', {
      channel: 'broker_email',
      error: 'resend: quota',
    });
    // The confirmation still ran despite the broker failure.
    expect(deps.sendLeadConfirmation).toHaveBeenCalled();
  });

  it('confirmation throw still returns 201 and logs notify_error', async () => {
    const deps = mockDeps({
      sendLeadConfirmation: vi.fn(async () => {
        throw new Error('resend: bad from');
      }),
    });
    const res = await runLeadPipeline(validBody(), CTX, deps);
    expect(res.status).toBe(201);
    expect(deps.logEvent).toHaveBeenCalledWith('lead-1', 'notify_error', {
      channel: 'lead_email',
      error: 'resend: bad from',
    });
  });

  it('TK-slotted confirmation body is skipped with the logged detail', async () => {
    const deps = mockDeps({
      sendLeadConfirmation: vi.fn(async () => ({ skipped: 'tk_body' as const })),
    });
    const res = await runLeadPipeline(validBody(), CTX, deps);
    expect(res.status).toBe(201);
    expect(deps.logEvent).toHaveBeenCalledWith('lead-1', 'email_lead_sent', {
      skipped: 'tk_body',
    });
  });

  it('successful sends log their events and finish 201', async () => {
    const deps = mockDeps();
    const res = await runLeadPipeline(validBody(), CTX, deps);
    expect(res.status).toBe(201);
    expect((await res.json()).id).toBe('lead-1');
    expect(deps.logEvent).toHaveBeenCalledWith('lead-1', 'email_broker_sent');
    expect(deps.logEvent).toHaveBeenCalledWith(
      'lead-1',
      'email_lead_sent',
      undefined
    );
    expect(deps.crm.enqueue).toHaveBeenCalledWith('lead-1');
  });
});

/* ---- quiet-hours SMS branch (dormant: TWILIO_ENABLED=0) ------------------------------ */

describe('quiet-hours SMS branch', () => {
  it('is fully dormant while TWILIO_ENABLED is unset/0', async () => {
    const deps = mockDeps();
    await runLeadPipeline(validBody({ consentSms: true }), CTX, deps);
    expect(deps.sendSms).not.toHaveBeenCalled();
  });

  it('daytime ET sends; quiet hours queues (flag forced on for the test)', async () => {
    vi.stubEnv('TWILIO_ENABLED', '1');
    vi.stubEnv('BROKER_NOTIFY_PHONE', '+13055550100');

    // 2026-01-15T17:00Z = 12:00 EST — send window.
    const daytime = Date.parse('2026-01-15T17:00:00Z');
    const deps = mockDeps({ now: () => daytime });
    await runLeadPipeline(validBody({ startedAt: daytime - 10_000 }), CTX, deps);
    expect(deps.sendSms).toHaveBeenCalledTimes(1);
    expect(deps.logEvent).toHaveBeenCalledWith('lead-1', 'sms_sent');

    // 2026-01-15T03:00Z = 22:00 EST (prev day) — quiet hours.
    const night = Date.parse('2026-01-15T03:00:00Z');
    const deps2 = mockDeps({ now: () => night });
    await runLeadPipeline(validBody({ startedAt: night - 10_000 }), CTX, deps2);
    expect(deps2.sendSms).not.toHaveBeenCalled();
    expect(deps2.logEvent).toHaveBeenCalledWith('lead-1', 'sms_queued', {
      reason: 'quiet_hours',
    });
  });

  it('isQuietHoursEt boundary table (EST and EDT)', () => {
    expect(isQuietHoursEt(Date.parse('2026-01-15T02:00:00Z'))).toBe(true); // 21:00 EST
    expect(isQuietHoursEt(Date.parse('2026-01-15T12:59:00Z'))).toBe(true); // 07:59 EST
    expect(isQuietHoursEt(Date.parse('2026-01-15T13:00:00Z'))).toBe(false); // 08:00 EST
    expect(isQuietHoursEt(Date.parse('2026-01-15T17:00:00Z'))).toBe(false); // 12:00 EST
    expect(isQuietHoursEt(Date.parse('2026-07-15T01:00:00Z'))).toBe(true); // 21:00 EDT
    expect(isQuietHoursEt(Date.parse('2026-07-15T16:00:00Z'))).toBe(false); // 12:00 EDT
  });
});

/* ---- ip hashing ------------------------------------------------------------------------ */

describe('ip_hash', () => {
  it('never equals the raw IP, and the salt changes the hash', () => {
    vi.stubEnv('LEAD_IP_SALT', 'salt-a');
    const a = hashIp('203.0.113.7');
    expect(a).not.toBe('203.0.113.7');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toContain('203.0.113.7');

    vi.stubEnv('LEAD_IP_SALT', 'salt-b');
    const b = hashIp('203.0.113.7');
    expect(b).not.toBe(a);
  });

  it('throws MissingEnvError without the salt (503 upstream)', () => {
    expect(() => hashIp('203.0.113.7')).toThrow(MissingEnvError);
  });
});

/* ---- env discipline ------------------------------------------------------------------------ */

describe('env discipline', () => {
  it('requireEnv names every missing variable', () => {
    try {
      requireEnv('SUPABASE_URL', 'TURNSTILE_SECRET', 'LEAD_IP_SALT');
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(MissingEnvError);
      expect((err as MissingEnvError).variables).toEqual([
        'SUPABASE_URL',
        'TURNSTILE_SECRET',
        'LEAD_IP_SALT',
      ]);
    }
  });

  it('route module imports without throwing and answers 503 naming the vars', async () => {
    // Import with zero provider env: module scope must be side-effect free.
    const { POST } = await import('@/app/api/leads/route');
    const { NextRequest } = await import('next/server');
    const res = await POST(
      new NextRequest('http://localhost/api/leads', {
        method: 'POST',
        body: JSON.stringify(validBody()),
      })
    );
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string; missing: string[] };
    expect(body.error).toBe('missing_env');
    expect(body.missing).toEqual([
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'TURNSTILE_SECRET',
      'LEAD_IP_SALT',
    ]);
  });
});
