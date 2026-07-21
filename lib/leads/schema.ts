import { z } from 'zod';
import type { LeadSubmission } from '@/lib/types';
import { LEAD_FIELD_SPEC } from './fields';
import { isRegisteredSource } from './registry';

/**
 * ============================================================================
 * LEAD SUBMISSION SCHEMA — server-only zod mirror of `LeadSubmission`.
 * ============================================================================
 *
 * zod never reaches a client bundle (reference D9): the island validates from
 * LEAD_FIELD_SPEC; this schema re-derives its caps from the same table and adds
 * the server-only concerns (enum sets, attribution registry check, payload/utm
 * hygiene). Unknown keys are stripped (zod object default), so nothing a caller
 * invents survives into storage.
 *
 * Length caps are identical to the SQL check constraints — see fields.ts.
 */

const F = LEAD_FIELD_SPEC;
const EMAIL_RE = new RegExp(F.email.pattern);
const PHONE_RE = new RegExp(F.phone.pattern);

/** '' from an untouched optional input is treated as absent. */
const emptyToUndefined = (v: unknown) => (v === '' ? undefined : v);

const UTM_KEY_RE = /^utm_[a-z][a-z0-9_]{0,30}$/;

export const leadSubmissionSchema = z
  .object({
    locale: z.enum(['en', 'es']),
    portal: z
      .enum(['sellers', 'buyers', 'investors', 'landlords', 'tenants'])
      .optional(),
    sourceType: z.enum(['portal_cta', 'tool', 'listing', 'contact', 'booking']),
    sourceSlug: z.preprocess(
      emptyToUndefined,
      z.string().min(1).max(200).optional()
    ),
    route: z.string().min(1).max(300).startsWith('/'),
    intent: z.enum([
      'sell',
      'buy',
      'invest',
      'lease-out',
      'rent',
      'valuation',
      'booking',
      'general',
    ]),
    fullName: z
      .string()
      .trim()
      .min(F.fullName.minLength)
      .max(F.fullName.maxLength),
    email: z.string().trim().max(F.email.maxLength).regex(EMAIL_RE),
    phone: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .min(F.phone.minLength)
        .max(F.phone.maxLength)
        .regex(PHONE_RE)
        .optional()
    ),
    message: z.preprocess(
      emptyToUndefined,
      z.string().max(F.message.maxLength).optional()
    ),
    payload: z
      .record(z.unknown())
      .refine((p) => JSON.stringify(p).length <= 16384, {
        message: 'payload too large',
      })
      .optional(),
    utm: z
      .record(z.string().max(200))
      .refine(
        (u) =>
          Object.keys(u).length <= 8 &&
          Object.keys(u).every((k) => UTM_KEY_RE.test(k)),
        { message: 'invalid utm keys' }
      )
      .optional(),
    consentSms: z.boolean(),
    consentMarketing: z.boolean(),
    turnstileToken: z.string().min(1).max(4096),
    hp: z.string().max(200).optional(),
    startedAt: z.number().int().positive(),
  })
  .superRefine((v, ctx) => {
    if (!isRegisteredSource(v.sourceType, v.sourceSlug, v.portal)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sourceSlug'],
        message: `unregistered source: ${v.sourceType}${v.sourceSlug ? `/${v.sourceSlug}` : ''}`,
      });
    }
  });

/** Compile-time proof the schema output stays assignable to the wire type. */
export type ParsedLeadSubmission = z.output<typeof leadSubmissionSchema>;
const _assertAssignable: LeadSubmission = {} as ParsedLeadSubmission;
void _assertAssignable;
