import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Dispatch 6b — crawler exposure is closed by default. robots() opens to the
 * D12 allow list ONLY when NEXT_PUBLIC_SITE_ORIGIN carries a real origin;
 * unset, empty, or the TK_DOMAIN placeholder closes the site: full disallow
 * for every agent, no Sitemap line, no Host line. The switch is origin
 * configuration — never NODE_ENV, never a Vercel environment name — so a
 * production deploy with no domain configured is still closed.
 *
 * The same origin condition drives the x-robots-tag response header owned by
 * next.config.mjs headers(), asserted in the second describe below.
 */

const ENV_KEY = 'NEXT_PUBLIC_SITE_ORIGIN';
const CONFIGURED = 'https://configured.example';

/**
 * The D12 allow list, byte-identical to the launch policy. This constant is
 * the pin: any drift in agents, order, or paths in the OPEN state fails here.
 */
const D12_RULES = [
  ...[
    'Googlebot',
    'Bingbot',
    'Google-Extended',
    'Applebot-Extended',
    'GPTBot',
    'OAI-SearchBot',
    'ClaudeBot',
    'PerplexityBot',
  ].map((userAgent) => ({ userAgent, allow: '/', disallow: '/api/' })),
  { userAgent: '*', allow: '/', disallow: '/api/' },
];

const initialOrigin = process.env[ENV_KEY];
const initialNodeEnv = process.env.NODE_ENV;

/** Next's types mark NODE_ENV readonly; the runtime var is plain mutable. */
const setNodeEnv = (value: string | undefined) => {
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
};

afterEach(() => {
  if (initialOrigin === undefined) delete process.env[ENV_KEY];
  else process.env[ENV_KEY] = initialOrigin;
  setNodeEnv(initialNodeEnv);
  vi.resetModules();
});

/**
 * config/origin.ts binds SITE_ORIGIN at module load, so each state needs a
 * fresh module graph: set the env, reset the registry, re-import robots().
 */
async function robotsWith(origin: string | undefined) {
  if (origin === undefined) delete process.env[ENV_KEY];
  else process.env[ENV_KEY] = origin;
  vi.resetModules();
  const mod = await import('@/app/robots');
  return mod.default();
}

describe('robots() closed state (placeholder origin)', () => {
  const CLOSED = { rules: [{ userAgent: '*', disallow: '/' }] };

  it('origin unset → full disallow, no sitemap, no host', async () => {
    expect(await robotsWith(undefined)).toEqual(CLOSED);
  });

  it('origin empty or whitespace → still closed (an "" override must not open)', async () => {
    expect(await robotsWith('')).toEqual(CLOSED);
    expect(await robotsWith('   ')).toEqual(CLOSED);
  });

  it('origin still carrying the placeholder → closed', async () => {
    expect(await robotsWith('https://TK_DOMAIN.example')).toEqual(CLOSED);
  });

  it('NODE_ENV=production does not open the site — the switch is the origin', async () => {
    setNodeEnv('production');
    expect(await robotsWith(undefined)).toEqual(CLOSED);
  });
});

describe('robots() open state (real origin configured)', () => {
  it('emits the D12 allow list exactly, plus Sitemap and Host', async () => {
    const result = await robotsWith(CONFIGURED);
    expect(result.rules).toEqual(D12_RULES);
    expect(result.sitemap).toBe(`${CONFIGURED}/sitemap.xml`);
    expect(result.host).toBe(CONFIGURED);
  });

  it('names all eight agents and the wildcard — none dropped, none added', async () => {
    const result = await robotsWith(CONFIGURED);
    const agents = (result.rules as Array<{ userAgent: string }>).map(
      (r) => r.userAgent
    );
    expect(agents).toHaveLength(9);
    expect(new Set(agents).size).toBe(9);
  });
});

describe('x-robots-tag header (next.config.mjs headers())', () => {
  /**
   * allowJs is off, so the .mjs config cannot be a static import — tsc would
   * reject the specifier. A computed dynamic import bypasses resolution;
   * headers() reads the env at call time, so one import serves both states.
   */
  async function loadHeaders() {
    const specifier = new URL('../next.config.mjs', import.meta.url).href;
    const mod = await import(/* @vite-ignore */ specifier);
    return mod.default.headers as () => Promise<
      Array<{ source: string; headers: Array<{ key: string; value: string }> }>
    >;
  }

  it('closed state: noindex, nofollow on every path', async () => {
    const headers = await loadHeaders();
    delete process.env[ENV_KEY];
    expect(await headers()).toEqual([
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]);
  });

  it('placeholder origin explicitly set: still noindex', async () => {
    const headers = await loadHeaders();
    process.env[ENV_KEY] = 'https://TK_DOMAIN.example';
    const rules = await headers();
    expect(rules).toHaveLength(1);
    expect(rules[0]?.headers[0]?.value).toBe('noindex, nofollow');
  });

  it('open state: the header is not emitted', async () => {
    const headers = await loadHeaders();
    process.env[ENV_KEY] = CONFIGURED;
    expect(await headers()).toEqual([]);
  });
});
