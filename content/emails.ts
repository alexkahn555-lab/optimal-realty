import type { Localized } from '@/lib/types';

/**
 * ============================================================================
 * TRANSACTIONAL EMAIL CONTENT — lead confirmation (the client's voice).
 * ============================================================================
 *
 * The BODY is the broker speaking to a real person, which no agent authors
 * (root README non-negotiable 4). It ships as a placeholder marker in both
 * locales; lib/leads/notify.ts detects the marker and SKIPS the send entirely
 * (logging the skip on the lead's event chain) until the client's copy lands
 * here. Placeholder text is never delivered to a real inbox.
 *
 * Subject and greeting are structural chrome, authorable in-house like
 * ui-strings. The signature is assembled at render time from config/entity.ts,
 * omitting any field still unconfirmed there.
 *
 * This file is scanned by check-content.mjs: it must contain EXACTLY the two
 * body markers below and no others.
 */

export const LEAD_CONFIRM_EMAIL: {
  subject: Localized;
  greeting: Localized;
  body: Localized;
} = {
  subject: {
    en: 'We received your message — Optimal Realty',
    es: 'Recibimos su mensaje — Optimal Realty',
  },
  greeting: {
    en: 'Hello',
    es: 'Hola',
  },
  body: {
    en: 'TK_LEAD_CONFIRM_EMAIL_EN',
    es: 'TK_LEAD_CONFIRM_EMAIL_ES',
  },
};
