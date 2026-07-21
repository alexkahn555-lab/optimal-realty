import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { NullCrmAdapter, getCrmAdapter } from '@/lib/crm/adapter';
import { getSupabase } from '@/lib/leads/clients';
import { GET } from '@/app/api/crm/sync/route';

vi.mock('@/lib/leads/clients', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/leads/clients')>();
  return { ...actual, getSupabase: vi.fn() };
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('CRM adapter', () => {
  it('provides a no-op null adapter', async () => {
    const adapter = new NullCrmAdapter();

    expect(adapter.provider).toBe('null');
    await expect(adapter.upsert()).resolves.toEqual({ status: 'skipped' });
    await expect(adapter.enqueue()).resolves.toBeUndefined();
  });

  it.each([undefined, 'null', ''])(
    'selects the null adapter for CRM_PROVIDER=%s',
    (provider) => {
      if (provider === undefined) vi.stubEnv('CRM_PROVIDER', '');
      else vi.stubEnv('CRM_PROVIDER', provider);

      expect(getCrmAdapter()).toBeInstanceOf(NullCrmAdapter);
    }
  );

  it('rejects an unimplemented Attio provider', () => {
    vi.stubEnv('CRM_PROVIDER', 'attio');

    expect(getCrmAdapter).toThrow('CRM provider not implemented: attio');
  });
});

describe('GET /api/crm/sync', () => {
  it('returns 503 with the missing CRON_SECRET', async () => {
    vi.stubEnv('CRON_SECRET', '');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await GET(
      new NextRequest('http://localhost/api/crm/sync')
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: 'missing_env',
      missing: ['CRON_SECRET'],
    });
  });

  it.each([undefined, 'Bearer wrong'])(
    'returns 401 for authorization %s',
    async (authorization) => {
      vi.stubEnv('CRON_SECRET', 'cron-secret');
      const headers = authorization ? { authorization } : undefined;

      const response = await GET(
        new NextRequest('http://localhost/api/crm/sync', { headers })
      );

      expect(response.status).toBe(401);
    }
  );

  it('processes a pending lead through the null adapter', async () => {
    vi.stubEnv('CRON_SECRET', 'cron-secret');
    vi.stubEnv('CRM_PROVIDER', 'null');
    const lead = {
      id: 'lead-1',
      created_at: '2026-07-20T12:00:00.000Z',
      locale: 'en',
      portal: null,
      source_type: 'contact',
      source_slug: null,
      route: '/en/contact',
      intent: 'general',
      full_name: 'Test Person',
      email: 'lead@example.com',
      phone: null,
      crm_sync_status: 'pending',
      crm_attempts: 0,
    };
    const update = vi.fn(() => ({
      eq: vi.fn(async () => ({ data: null, error: null })),
    }));
    const insert = vi.fn(async () => ({ data: null, error: null }));
    const selectBuilder = {
      select: vi.fn(() => selectBuilder),
      in: vi.fn(() => selectBuilder),
      lt: vi.fn(() => selectBuilder),
      order: vi.fn(() => selectBuilder),
      limit: vi.fn(async () => ({ data: [lead], error: null })),
    };
    const from = vi.fn((table: string) => {
      if (table === 'lead_events') return { insert };
      return { ...selectBuilder, update };
    });
    vi.mocked(getSupabase).mockReturnValue({ from } as never);

    const response = await GET(
      new NextRequest('http://localhost/api/crm/sync', {
        headers: { authorization: 'Bearer cron-secret' },
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      processed: 1,
      synced: 0,
      skipped: 1,
      failed: 0,
    });
    expect(update).toHaveBeenCalledWith({ crm_sync_status: 'skipped' });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'status_changed' })
    );
  });
});
