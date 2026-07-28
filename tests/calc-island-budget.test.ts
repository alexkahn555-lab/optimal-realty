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

/** 5e: measure a module with the chrome dictionary externalized, so the
 *  number is the ENGINE's own weight, not ui-strings' (the island bundle
 *  above already pays for ui-strings once). */
const uiStringsExternal: Plugin = {
  name: 'ui-strings-external',
  setup(b) {
    b.onResolve({ filter: /content\/ui-strings$/ }, (args) => ({
      path: args.path,
      external: true,
    }));
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

  it('the vacancy-cost engine alone is at most 2 KB gzipped (5e)', async () => {
    const result = await build({
      entryPoints: [join(ROOT, 'lib/calc/vacancy-cost.ts')],
      bundle: true,
      minify: true,
      write: false,
      format: 'esm',
      external: ['react', 'react-dom', 'react/jsx-runtime', 'next'],
      define: { 'process.env.NODE_ENV': '"production"' },
      plugins: [uiStringsExternal, atAlias],
      logLevel: 'silent',
    });

    const output = result.outputFiles[0];
    expect(output).toBeDefined();
    const gzipped = gzipSync(output!.contents).byteLength;
    // Surfaced in the completion report.
    console.info(
      `[budget] vacancy-cost engine: ${output!.contents.byteLength} B raw, ${gzipped} B gzipped`
    );
    expect(gzipped).toBeLessThanOrEqual(2 * 1024);
  });

  it('the rental-cashflow engine alone is at most 3 KB gzipped (5f)', async () => {
    const result = await build({
      entryPoints: [join(ROOT, 'lib/calc/rental-cashflow.ts')],
      bundle: true,
      minify: true,
      write: false,
      format: 'esm',
      external: ['react', 'react-dom', 'react/jsx-runtime', 'next'],
      define: { 'process.env.NODE_ENV': '"production"' },
      plugins: [uiStringsExternal, atAlias],
      logLevel: 'silent',
    });

    const output = result.outputFiles[0];
    expect(output).toBeDefined();
    const gzipped = gzipSync(output!.contents).byteLength;
    // Surfaced in the completion report.
    console.info(
      `[budget] rental-cashflow engine: ${output!.contents.byteLength} B raw, ${gzipped} B gzipped`
    );
    expect(gzipped).toBeLessThanOrEqual(3 * 1024);
  });
});
