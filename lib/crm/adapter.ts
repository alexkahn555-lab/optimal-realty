/**
 * ============================================================================
 * CRM ADAPTER — the seam the Attio cutover slots into (reference Part 9).
 * ============================================================================
 *
 * The pipeline never talks to a CRM directly. Step 8 calls `enqueue`
 * (non-blocking; the lead row is already `crm_sync_status='pending'`), and the
 * CRON_SECRET-guarded sync route drains pending/failed rows through `upsert`.
 *
 * Phase 2 ships ONLY the null adapter: `upsert` reports `skipped`, so the sweep
 * marks rows skipped and the pipeline stays exercisable end-to-end with no
 * provider. Flipping CRM_PROVIDER to a real provider is the entire cutover —
 * no Attio code exists here by design.
 */

/** The columns the adapter is allowed to see (never the ip_hash). */
export interface CrmLeadRow {
  id: string;
  created_at: string;
  locale: string;
  portal: string | null;
  source_type: string;
  source_slug: string | null;
  route: string;
  intent: string;
  full_name: string;
  email: string;
  phone: string | null;
  crm_sync_status: string;
  crm_attempts: number;
}

export type CrmUpsertResult =
  | { status: 'synced'; externalId: string }
  | { status: 'skipped' };

export interface CrmAdapter {
  readonly provider: string;
  /** Pipeline step 8. Must never throw into the response path; noop today. */
  enqueue(leadId: string): Promise<void>;
  /** Cron-driven push. A throw is recorded as a failed attempt. */
  upsert(lead: CrmLeadRow): Promise<CrmUpsertResult>;
}

export class NullCrmAdapter implements CrmAdapter {
  readonly provider = 'null';

  async enqueue(): Promise<void> {
    // The inserted row is already 'pending'; the sync sweep owns the rest.
  }

  async upsert(): Promise<CrmUpsertResult> {
    return { status: 'skipped' };
  }
}

/** CRM_PROVIDER is read lazily at call time — never at module scope. */
export function getCrmAdapter(): CrmAdapter {
  const provider = process.env.CRM_PROVIDER;
  if (provider === undefined || provider === '' || provider === 'null') {
    return new NullCrmAdapter();
  }
  throw new Error(`CRM provider not implemented: ${provider}`);
}
