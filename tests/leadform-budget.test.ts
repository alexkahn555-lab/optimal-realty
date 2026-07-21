import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { build, type Plugin } from 'esbuild';
import { describe, expect, it } from 'vitest';
import { UTM_SNIPPET } from '@/components/forms/utm';

/**
 * Byte budgets, enforced (a budget without a gate is a wish):
 *  - LeadForm island (LeadForm + TurnstileLazy + everything they pull in,
 *    react externalized): <= 12 KB gzipped.
 *  - utm layout snippet: <= 0.3 KB.
 *
 * esbuild arrives transitively via vitest's vite dependency; the bundle here
 * approximates the island's contribution to the route chunk (minified ESM,
 * framework externalized, Turnstile site key defined so the widget path is
 * COUNTED — the worst case ships).
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const atAlias: Plugin = {
  name: 'at-alias',
  setup(b) {
    b.onResolve({ filter: /^@\// }, (args) =>
      b.resolve(`./${args.path.slice(2)}`, {
        kind: args.kind,
        resolveDir: ROOT,
      })
    );
  },
};

describe('phase 2 byte budgets', () => {
  it('LeadForm island is at most 12 KB gzipped', async () => {
    const result = await build({
      entryPoints: [join(ROOT, 'components/forms/index.ts')],
      bundle: true,
      minify: true,
      write: false,
      format: 'esm',
      jsx: 'automatic',
      external: ['react', 'react-dom', 'react/jsx-runtime', 'next'],
      define: {
        'process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY': '"budget-probe"',
        'process.env.NODE_ENV': '"production"',
      },
      plugins: [atAlias],
      logLevel: 'silent',
    });

    const output = result.outputFiles[0];
    expect(output).toBeDefined();
    const gzipped = gzipSync(output!.contents).byteLength;
    // Surfaced in the completion report.
    console.info(
      `[budget] LeadForm island: ${output!.contents.byteLength} B raw, ${gzipped} B gzipped`
    );
    expect(gzipped).toBeLessThanOrEqual(12 * 1024);
  });

  it('utm snippet is at most 0.3 KB', () => {
    const bytes = Buffer.byteLength(UTM_SNIPPET, 'utf8');
    console.info(`[budget] utm snippet: ${bytes} B`);
    expect(bytes).toBeLessThanOrEqual(0.3 * 1024);
  });
});
