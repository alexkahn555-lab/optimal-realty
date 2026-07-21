/**
 * ============================================================================
 * LEAD FIELD SPEC — the one description of user-editable lead fields.
 * ============================================================================
 *
 * CLIENT-SAFE BY CONSTRUCTION: plain serializable data, zero imports. The
 * LeadForm island derives its client-side validation from this table, and
 * lib/leads/schema.ts derives the server-side zod schema from the same table —
 * so the two can never disagree. zod itself stays server-only (reference D9);
 * this file is the only validation artifact a client bundle may import.
 *
 * Length caps are IDENTICAL to the SQL check constraints in
 * supabase/schema.sql. Change them there first or not at all.
 */

export interface LeadFieldSpec {
  required: boolean;
  minLength?: number;
  maxLength: number;
  /** RegExp source string (client does `new RegExp(pattern)`). */
  pattern?: string;
}

/** Mirrors supabase/schema.sql: full_name 2..120, email format, message <= 4000. */
export const LEAD_FIELD_SPEC = {
  fullName: { required: true, minLength: 2, maxLength: 120 },
  // Same expression as the SQL email check constraint.
  email: { required: true, maxLength: 320, pattern: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$' },
  phone: { required: false, minLength: 7, maxLength: 30, pattern: '^\\+?[0-9 ().-]{7,29}$' },
  message: { required: false, maxLength: 4000 },
} as const satisfies Record<string, LeadFieldSpec>;

export type LeadFieldName = keyof typeof LEAD_FIELD_SPEC;
