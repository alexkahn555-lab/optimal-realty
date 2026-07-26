import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { build, type Plugin } from 'esbuild';
import { describe, expect, it } from 'vitest';

/**
 * Phase 3 byte budget (a budget without a gate is a wish):
 *  - CalcIsland — the island entry plus EVERYTHING it pulls in client-side
 *    (registry → net-proceeds engine, CalcFields, ResultPanel → LeadForm,
 *    query codec, labels, chrome strings; react/next externalized):
 *    <= 25 KB gzipped. The number is surfaced in the completion report.
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

describe('phase 3 byte budgets', () => {
  it('CalcIsland is at most 25 KB gzipped', async () => {
    const result = await build({
      entryPoints: [join(ROOT, 'components/calc/CalcIsland.tsx')],
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
      `[budget] CalcIsland: ${output!.contents.byteLength} B raw, ${gzipped} B gzipped`
    );
    expect(gzipped).toBeLessThanOrEqual(25 * 1024);
  });
});
