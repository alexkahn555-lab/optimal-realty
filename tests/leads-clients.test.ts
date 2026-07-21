import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getResend,
  getSupabase,
  hashIp,
  MissingEnvError,
  verifyTurnstile,
} from '@/lib/leads/clients';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('lead provider clients', () => {
  it('reports both missing Supabase variables', () => {
    vi.stubEnv('SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');

    expect(getSupabase).toThrow(MissingEnvError);
    expect(getSupabase).toThrow(/SUPABASE_URL.*SUPABASE_SERVICE_ROLE_KEY/);
  });

  it('constructs a Supabase client without network I/O', () => {
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key');

    expect(getSupabase()).toBeTruthy();
  });

  it('reports a missing Resend API key', () => {
    vi.stubEnv('RESEND_API_KEY', '');

    expect(getResend).toThrow(MissingEnvError);
    expect(getResend).toThrow(/RESEND_API_KEY/);
  });

  it.each([
    [{ ok: true, json: async () => ({ success: true }) }, true],
    [{ ok: true, json: async () => ({ success: false }) }, false],
    [{ ok: false, json: async () => ({ success: true }) }, false],
  ])('maps the Turnstile response to %s', async (response, expected) => {
    vi.stubEnv('TURNSTILE_SECRET', 'secret');
    const fetchMock = vi.fn(async (..._args: Parameters<typeof fetch>) =>
      response as Response
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(verifyTurnstile('token-value')).resolves.toBe(expected);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({ body: expect.any(URLSearchParams) })
    );
    const options = fetchMock.mock.calls[0]?.[1];
    expect(String(options?.body)).toContain('response=token-value');
  });

  it('fails closed when Turnstile fetch rejects', async () => {
    vi.stubEnv('TURNSTILE_SECRET', 'secret');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(verifyTurnstile('token-value')).resolves.toBe(false);
  });

  it('requires the Turnstile secret before fetching', async () => {
    vi.stubEnv('TURNSTILE_SECRET', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(verifyTurnstile('token-value')).rejects.toThrow(
      MissingEnvError
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('hashes IP and salt deterministically to 64 hex characters', () => {
    vi.stubEnv('LEAD_IP_SALT', 'test-salt');

    const first = hashIp('203.0.113.1');
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(hashIp('203.0.113.1')).toBe(first);
    expect(hashIp('203.0.113.2')).not.toBe(first);
  });
});
