import { getSupabase } from './clients';
import type { LeadEventType, LeadInsertRow } from './pipeline';

/**
 * Real storage implementations behind the pipeline's deps seam. Every function
 * constructs its client at call time (lazy env); nothing here runs at import.
 * Single-writer: these are the only code paths that touch the lead tables.
 */

/**
 * Fixed-window limiter over rate_limits (ip_hash, window_start, hits).
 * Read-then-upsert is not atomic; at this volume a lost increment under
 * concurrency is acceptable for an abuse limiter (documented for the operator).
 */
export async function incrementRateLimit(
  ipHash: string,
  windowStartIso: string
): Promise<number> {
  const supabase = getSupabase();
  const { data, error: selectError } = await supabase
    .from('rate_limits')
    .select('hits')
    .eq('ip_hash', ipHash)
    .eq('window_start', windowStartIso)
    .maybeSingle();
  if (selectError) throw new Error(`rate_limits select: ${selectError.message}`);

  const hits = (data?.hits ?? 0) + 1;
  const { error: upsertError } = await supabase
    .from('rate_limits')
    .upsert({ ip_hash: ipHash, window_start: windowStartIso, hits });
  if (upsertError) throw new Error(`rate_limits upsert: ${upsertError.message}`);

  return hits;
}

export async function findRecentDuplicate(
  email: string,
  sourceType: string,
  sourceSlug: string | undefined,
  sinceIso: string
): Promise<{ id: string } | null> {
  const supabase = getSupabase();
  let query = supabase
    .from('leads')
    .select('id')
    // Case-insensitive match; escape ilike pattern metacharacters.
    .ilike('email', email.replace(/[\\%_]/g, (m) => `\\${m}`))
    .eq('source_type', sourceType)
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false })
    .limit(1);
  query = sourceSlug
    ? query.eq('source_slug', sourceSlug)
    : query.is('source_slug', null);

  const { data, error } = await query;
  if (error) throw new Error(`leads dedupe select: ${error.message}`);
  const first = data?.[0];
  return first ? { id: first.id } : null;
}

/**
 * Insert-first (reference D8): the lead row commits, then its 'created' event.
 * PostgREST offers no client-side transaction; if the event insert fails the
 * lead is KEPT — a missing audit row is recoverable, a lost lead is not.
 */
export async function insertLead(row: LeadInsertRow): Promise<{ id: string }> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('leads')
    .insert(row)
    .select('id')
    .single();
  if (error || !data) {
    throw new Error(`leads insert: ${error?.message ?? 'no row returned'}`);
  }

  try {
    const { error: eventError } = await supabase
      .from('lead_events')
      .insert({ lead_id: data.id, type: 'created' });
    if (eventError) throw new Error(eventError.message);
  } catch (err) {
    console.error('[leads] created-event insert failed (lead kept):', err);
  }

  return { id: data.id };
}

/** Event logging never throws — a failed audit write must not break the flow. */
export async function logEvent(
  leadId: string,
  type: LeadEventType,
  detail?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('lead_events')
      .insert({ lead_id: leadId, type, detail: detail ?? null });
    if (error) throw new Error(error.message);
  } catch (err) {
    console.error(`[leads] event log failed (${type}):`, err);
  }
}
