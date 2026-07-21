import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LeadSubmission } from '@/lib/types';
import {
  renderBrokerEmail,
  renderLeadConfirmEmail,
  sendLeadConfirmation,
} from '@/lib/leads/notify';

const LEAD: LeadSubmission = {
  locale: 'en',
  portal: 'sellers',
  sourceType: 'contact',
  route: '/en/contact',
  intent: 'general',
  fullName: 'Test Person',
  email: 'lead@example.com',
  phone: '+13055550100',
  message: 'Two lines\nhere',
  payload: { estimate: 425000 },
  utm: { utm_source: 'google', utm_campaign: 'brand' },
  consentSms: true,
  consentMarketing: false,
  turnstileToken: 'tok',
  hp: '',
  startedAt: 1_790_000_000_000,
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('lead email rendering', () => {
  it('renders the broker subject', () => {
    expect(renderBrokerEmail(LEAD, 'lead-1').subject).toBe(
      'New lead: Test Person — contact (en)'
    );
  });

  it('renders all operational broker details', () => {
    const { text } = renderBrokerEmail(LEAD, 'lead-123');

    expect(text).toContain(LEAD.email);
    expect(text).toContain(LEAD.phone);
    expect(text).toContain(LEAD.route);
    expect(text).toContain('utm_source=google');
    expect(text).toContain('estimate');
    expect(text).toContain('425000');
    expect(text).toMatch(/SMS\s+yes/);
    expect(text).toMatch(/Marketing\s+no/);
    expect(text).toContain('lead-123');
    expect(text).toContain('    Two lines\n    here');
  });

  it('uses em-dash placeholders for absent UTM, payload, and phone', () => {
    const { phone: _phone, utm: _utm, payload: _payload, ...minimal } = LEAD;
    const { text } = renderBrokerEmail(minimal, 'lead-1');

    expect(text).toMatch(/Phone\s+—/);
    expect(text).toMatch(/UTM\s+—/);
    expect(text).toMatch(/Payload\n  —/);
  });

  it('pins placeholder-body skips for both locales', () => {
    expect(renderLeadConfirmEmail('Test Person', 'en')).toEqual({
      skipped: 'tk_body',
    });
    expect(renderLeadConfirmEmail('Test Person', 'es')).toEqual({
      skipped: 'tk_body',
    });
  });

  it('skips confirmation before reading env or calling Resend', async () => {
    const send = vi.fn();
    const resend = { emails: { send } } as never;

    await expect(sendLeadConfirmation(resend, LEAD)).resolves.toEqual({
      skipped: 'tk_body',
    });
    expect(send).not.toHaveBeenCalled();
  });

  it('does not leak TK markers into the broker email', () => {
    expect(renderBrokerEmail(LEAD, 'lead-1').text).not.toMatch(/\bTK_/);
  });
});
