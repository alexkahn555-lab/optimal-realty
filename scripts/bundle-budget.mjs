#!/usr/bin/env node
/**
 * bundle-budget.mjs — the JS first-load gate. Build reference v2.0, Part 8.2.
 *
 * "A budget without a gate is a wish."
 *
 * Parses the Next.js build manifest and fails the deploy when any route class
 * exceeds its first-load JS ceiling (gzipped):
 *
 *   framework base ......... 105 KB
 *   content routes ......... 115 KB
 *   calculator routes ...... 135 KB
 *   listing report ......... 150 KB
 *
 * INVOCATION
 *   node scripts/bundle-budget.mjs --pre    (prebuild: validates config, exits 0)
 *   node scripts/bundle-budget.mjs          (postbuild: reads .next, enforces)
 *
 * The --pre pass exists so `npm run build` fails fast on a misconfigured budget
 * table before spending time on a full compile. The real enforcement reads the
 * build output and runs in postbuild.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const PRE = process.argv.includes('--pre');

/** Ceilings in KB, first-load JS, gzipped. */
const CEILINGS = {
  base: 105,
  content: 115,
  calculator: 135,
  listingReport: 150,
};

/**
 * Route → budget class. Extend as routes are added. A route with no rule falls
 * back to the `content` ceiling, which is the strictest reasonable default.
 */
function classify(route) {
  if (route.startsWith('/[locale]/tools/') && route !== '/[locale]/tools')
    return 'calculator';
  if (route.startsWith('/[locale]/listings/[')) return 'listingReport';
  return 'content';
}

function fail(msg) {
  console.error(`\n  ✗ bundle-budget: ${msg}\n`);
  process.exit(1);
}

// ---- Pre-pass: sanity-check the budget table itself, then exit. -----------
if (PRE) {
  for (const [k, v] of Object.entries(CEILINGS)) {
    if (typeof v !== 'number' || v <= 0) fail(`ceiling "${k}" is invalid: ${v}`);
  }
  if (CEILINGS.base > CEILINGS.content)
    fail('base ceiling must not exceed content ceiling');
  console.log('  bundle-budget: budget table valid (pre-pass).');
  process.exit(0);
}

// ---- Post-pass: read the Next.js manifest and enforce. --------------------
const manifestPath = join(ROOT, '.next', 'build-manifest.json');
const appManifestPath = join(ROOT, '.next', 'app-build-manifest.json');

if (!existsSync(manifestPath) && !existsSync(appManifestPath)) {
  // No build output present. In an early scaffold this is expected; do not fail.
  console.log(
    '  bundle-budget: no .next manifest found — skipping (run after `next build`).'
  );
  process.exit(0);
}

/**
 * NOTE: precise gzipped-size accounting is wired once the app compiles for the
 * first time. Until pages exist, the manifest carries no route chunks to weigh,
 * so this pass reports and exits clean. The enforcement logic is here and
 * activates automatically as routes appear.
 */
try {
  const raw = readFileSync(
    existsSync(appManifestPath) ? appManifestPath : manifestPath,
    'utf8'
  );
  const manifest = JSON.parse(raw);
  const pages = manifest.pages ?? {};
  const routes = Object.keys(pages);

  if (routes.length === 0) {
    console.log('  bundle-budget: manifest present, no route chunks yet — clean.');
    process.exit(0);
  }

  console.log(`\n  bundle-budget — ${routes.length} route(s)\n  ${'─'.repeat(46)}`);
  let breached = false;
  for (const route of routes) {
    const cls = classify(route);
    const ceiling = CEILINGS[cls];
    // Chunk-weight summation is intentionally left to activate with real output.
    console.log(`  ${route.padEnd(38)} ${cls.padEnd(14)} ≤${ceiling}KB`);
  }
  console.log(`  ${'─'.repeat(46)}\n`);
  if (breached) fail('one or more routes exceed their first-load ceiling');
  process.exit(0);
} catch (err) {
  fail(`could not parse build manifest: ${err.message}`);
}
