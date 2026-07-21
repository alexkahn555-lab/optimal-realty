import { afterEach, describe, expect, it, vi } from 'vitest';
import { leadSubmissionSchema } from '@/lib/leads/schema';

const BASE = {
  locale: 'en',
  sourceType: 'contact',
  route: '/en/contact',
  intent: 'general',
  fullName: 'Test Person',
  email: 'lead@example.com',
  consentSms: false,
  consentMarketing: false,
  turnstileToken: 'tok',
  hp: '',
  startedAt: 1_790_000_000_000,
} as const;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('leadSubmissionSchema', () => {
  it('parses the base input successfully', () => {
    expect(leadSubmissionSchema.safeParse(BASE).success).toBe(true);
  });

  it('strips unknown keys', () => {
    const result = leadSubmissionSchema.safeParse({
      ...BASE,
      admin: true,
      ipHash: 'x',
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).not.toHaveProperty('admin');
    expect(result.data).not.toHaveProperty('ipHash');
  });

  it('enforces SQL-identical name, message, and email caps', () => {
    expect(
      leadSubmissionSchema.safeParse({ ...BASE, fullName: 'x' }).success
    ).toBe(false);
    expect(
      leadSubmissionSchema.safeParse({ ...BASE, fullName: 'x'.repeat(121) })
        .success
    ).toBe(false);
    expect(
      leadSubmissionSchema.safeParse({ ...BASE, fullName: 'x'.repeat(120) })
        .success
    ).toBe(true);
    expect(
      leadSubmissionSchema.safeParse({ ...BASE, message: 'x'.repeat(4001) })
        .success
    ).toBe(false);
    expect(
      leadSubmissionSchema.safeParse({ ...BASE, message: 'x'.repeat(4000) })
        .success
    ).toBe(true);
    expect(
      leadSubmissionSchema.safeParse({ ...BASE, email: 'a@b' }).success
    ).toBe(false);
    expect(
      leadSubmissionSchema.safeParse({ ...BASE, email: 'a b@c.d' }).success
    ).toBe(false);
  });

  it('preprocesses empty optional strings to undefined', () => {
    const result = leadSubmissionSchema.safeParse({
      ...BASE,
      phone: '',
      message: '',
      sourceSlug: '',
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.phone).toBeUndefined();
    expect(result.data.message).toBeUndefined();
    expect(result.data.sourceSlug).toBeUndefined();
  });

  it('rejects sources absent from the registry', () => {
    expect(
      leadSubmissionSchema.safeParse({ ...BASE, sourceSlug: 'anything' })
        .success
    ).toBe(false);
    expect(
      leadSubmissionSchema.safeParse({
        ...BASE,
        sourceType: 'tool',
        sourceSlug: 'net-proceeds',
      }).success
    ).toBe(false);
    expect(
      leadSubmissionSchema.safeParse({ ...BASE, sourceType: 'booking' }).success
    ).toBe(false);
    expect(
      leadSubmissionSchema.safeParse({
        ...BASE,
        sourceType: 'portal_cta',
        portal: 'sellers',
      }).success
    ).toBe(false);
  });

  it('enforces UTM key, count, and value hygiene', () => {
    expect(
      leadSubmissionSchema.safeParse({ ...BASE, utm: { utm_source: 'x' } })
        .success
    ).toBe(true);
    expect(
      leadSubmissionSchema.safeParse({ ...BASE, utm: { evil: 'x' } }).success
    ).toBe(false);
    const nineKeys = Object.fromEntries(
      Array.from({ length: 9 }, (_, index) => [`utm_key_${index}`, 'x'])
    );
    expect(
      leadSubmissionSchema.safeParse({ ...BASE, utm: nineKeys }).success
    ).toBe(false);
    expect(
      leadSubmissionSchema.safeParse({
        ...BASE,
        utm: { utm_source: 'x'.repeat(201) },
      }).success
    ).toBe(false);
  });

  it('requires a token and a positive integer start time', () => {
    expect(
      leadSubmissionSchema.safeParse({ ...BASE, turnstileToken: '' }).success
    ).toBe(false);
    expect(
      leadSubmissionSchema.safeParse({ ...BASE, startedAt: 0 }).success
    ).toBe(false);
    expect(
      leadSubmissionSchema.safeParse({ ...BASE, startedAt: -1 }).success
    ).toBe(false);
    expect(
      leadSubmissionSchema.safeParse({ ...BASE, startedAt: 1.5 }).success
    ).toBe(false);
  });

  it('preserves honeypot content verbatim for the pipeline to handle', () => {
    const result = leadSubmissionSchema.safeParse({ ...BASE, hp: 'bot-fill' });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.hp).toBe('bot-fill');
  });
});
