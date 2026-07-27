import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { build, type Plugin } from 'esbuild';
import { describe, expect, it } from 'vitest';

/**
 * Phase 4b island byte budgets (a budget without a gate is a wish):
 *  - Lightbox: shell + overlay COMBINED ≤ 10 KB gzipped (esbuild inlines the
 *    shell's dynamic import when splitting is off, so one number covers the
 *    whole feature; at runtime the overlay half loads on first click only).
 *  - Map facade client ≤ 2 KB gzipped (facade + click-to-iframe swap).
 * Numbers are surfaced in the completion report.
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

async function gzippedSize(entry: string): Promise<number> {
  const result = await build({
    entryPoints: [join(ROOT, entry)],
    bundle: true,
    minify: true,
    write: false,
    format: 'esm',
    jsx: 'automatic',
    external: ['react', 'react-dom', 'react/jsx-runtime', 'next'],
    define: { 'process.env.NODE_ENV': '"production"' },
    plugins: [atAlias],
    logLevel: 'silent',
  });
  const output = result.outputFiles[0];
  expect(output).toBeDefined();
  const gzipped = gzipSync(output!.contents).byteLength;
  console.info(
    `[budget] ${entry}: ${output!.contents.byteLength} B raw, ${gzipped} B gzipped`
  );
  return gzipped;
}

describe('phase 4b island byte budgets', () => {
  it('Lightbox (shell + click-loaded overlay) is at most 10 KB gzipped', async () => {
    expect(
      await gzippedSize('components/listing/LightboxShell.tsx')
    ).toBeLessThanOrEqual(10 * 1024);
  });

  it('Map facade client is at most 2 KB gzipped', async () => {
    expect(
      await gzippedSize('components/listing/MapEmbedClient.tsx')
    ).toBeLessThanOrEqual(2 * 1024);
  });
});
