import { NextResponse, type NextRequest } from 'next/server';
import { getCrmAdapter, type CrmLeadRow } from '@/lib/crm/adapter';
import { getSupabase, MissingEnvError, requireEnv } from '@/lib/leads/clients';

/**
 * CRM sync sweep — CRON_SECRET-guarded. Selects pending/failed leads with
 * attempts < 5 (limit 25), pushes each through the adapter, updates status,
 * and logs the outcome on the lead's event chain. With the null adapter every
 * row processes to `skipped` — recorded as a status_changed event, since no
 * sync actually happened.
 *
 * Vercel cron sends `Authorization: Bearer ${CRON_SECRET}` automatically once
 * the env var exists; any other caller must present the same header.
 */

export const dynamic = 'force-dynamic';

const BATCH_LIMIT = 25;
const MAX_ATTEMPTS = 5;

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const [secret] = requireEnv('CRON_SECRET');
    if (request.headers.get('authorization') !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    const adapter = getCrmAdapter();

    const { data: rows, error: selectError } = await supabase
      .from('leads')
      .select(
        'id, created_at, locale, portal, source_type, source_slug, route, intent, full_name, email, phone, crm_sync_status, crm_attempts'
      )
      .in('crm_sync_status', ['pending', 'failed'])
      .lt('crm_attempts', MAX_ATTEMPTS)
      .order('created_at', { ascending: true })
      .limit(BATCH_LIMIT);

    if (selectError) {
      return NextResponse.json(
        { error: 'select_failed', detail: selectError.message },
        { status: 500 }
      );
    }

    const counts = { processed: 0, synced: 0, skipped: 0, failed: 0 };

    for (const lead of (rows ?? []) as CrmLeadRow[]) {
      counts.processed += 1;
      try {
        const result = await adapter.upsert(lead);

        if (result.status === 'skipped') {
          counts.skipped += 1;
          await supabase
            .from('leads')
            .update({ crm_sync_status: 'skipped' })
            .eq('id', lead.id);
          await logEvent(supabase, lead.id, 'status_changed', {
            field: 'crm_sync_status',
            from: lead.crm_sync_status,
            to: 'skipped',
            provider: adapter.provider,
          });
        } else {
          counts.synced += 1;
          await supabase
            .from('leads')
            .update({
              crm_sync_status: 'synced',
              crm_external_id: result.externalId,
              crm_attempts: lead.crm_attempts + 1,
            })
            .eq('id', lead.id);
          await logEvent(supabase, lead.id, 'crm_synced', {
            provider: adapter.provider,
            externalId: result.externalId,
          });
        }
      } catch (err) {
        counts.failed += 1;
        const detail = err instanceof Error ? err.message : String(err);
        await supabase
          .from('leads')
          .update({
            crm_sync_status: 'failed',
            crm_attempts: lead.crm_attempts + 1,
          })
          .eq('id', lead.id);
        await logEvent(supabase, lead.id, 'crm_failed', { error: detail });
      }
    }

    return NextResponse.json(counts, { status: 200 });
  } catch (err) {
    if (err instanceof MissingEnvError) {
      console.error('[crm/sync] missing env:', err.variables.join(', '));
      return NextResponse.json(
        { error: 'missing_env', missing: err.variables },
        { status: 503 }
      );
    }
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'sync_failed', detail }, { status: 500 });
  }
}

/** Event logging never fails the sweep. */
async function logEvent(
  supabase: ReturnType<typeof getSupabase>,
  leadId: string,
  type: string,
  detail: Record<string, unknown>
): Promise<void> {
  try {
    await supabase
      .from('lead_events')
      .insert({ lead_id: leadId, type, detail });
  } catch (err) {
    console.error('[crm/sync] event log failed:', err);
  }
}
