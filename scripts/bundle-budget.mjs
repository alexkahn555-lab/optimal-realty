#!/usr/bin/env node
/**
 * bundle-budget.mjs — the JS first-load gate. Build reference v2.0, Part 8.2.
 *
 * "A budget without a gate is a wish."
 *
 * Weighs every prerendered route's first-load JS (gzipped) and fails the build
 * when any route class exceeds its ceiling:
 *
 *   framework base ......... 155 KB   (/[locale] home router)
 *   content routes ......... 162 KB   (portal hubs, subpages, about, legal, contact)
 *   calculator routes ...... 167 KB   (/[locale]/<tools>/<sub>)
 *   listing report ......... 174 KB   (/[locale]/<listings>/<sub> — Phase 4)
 *
 *   Ceilings are Turbopack-recalibrated (2026-07-26); derivations sit on the
 *   CEILINGS table below. The reference doc's Part 8.2 table (base 105) was
 *   webpack-era Next 14 and predates the measured Next 16 + Turbopack floor.
 *
 * INVOCATION
 *   node scripts/bundle-budget.mjs --pre    (prebuild: validates config, exits 0)
 *   node scripts/bundle-budget.mjs          (postbuild: reads .next, enforces)
 *
 * WHERE THE NUMBERS COME FROM (Next 16 + Turbopack)
 *   Turbopack does NOT write the webpack-era `.next/app-build-manifest.json`;
 *   the top-level `.next/build-manifest.json` carries only a pages-router
 *   `/_app` stub with zero files (which is why the pre-repair gate reported
 *   exactly one weightless route). Per-route chunk lists live in
 *   `.next/server/app/<route>/page/build-manifest.json` (rootMainFiles) and the
 *   RSC client-reference manifests — but neither distinguishes concrete URLs
 *   that share a dynamic pattern (the calculator page vs. a seller subpage are
 *   both `/[locale]/[section]/[sub]`). The ground truth per concrete URL is the
 *   prerendered document itself, so this gate:
 *
 *     1. enumerates concrete routes from `.next/prerender-manifest.json`
 *        (url → srcRoute pattern),
 *     2. parses `<script src>` tags out of `.next/server/app/<url>.html` —
 *        exactly the JS a modern browser fetches on first load (`noModule`
 *        polyfill excluded: module-supporting browsers never request it),
 *     3. gzips the referenced chunk files under `.next/` (level 9, matching
 *        the `gzip-size` default Next itself historically used) and sums.
 *
 *   Routes with no HTML document (api/*, robots.txt, sitemap.xml, llms.txt)
 *   ship no client JS and are skipped; framework error shells (_not-found,
 *   _global-error) have no Part 8 class and are skipped — both are printed,
 *   never silently dropped. A page route missing its HTML is a hard failure.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

const ROOT = process.cwd();

/**
 * Ceilings in KB, first-load JS, gzipped. Part 8.2, recalibrated 2026-07-26 to
 * the measured Next 16 + Turbopack floor — do not edit to make a breach pass;
 * every number below is (measured floor) + (islands where the class carries
 * them) + (~12–15 KB growth headroom), so any future edit must restate its
 * derivation from a fresh measurement.
 *
 * Measured floors, this tree, islands correctly scoped (leak fixed):
 *   142.1  framework floor — /[locale] home: React+Next runtime, layout,
 *          MobileNav, fonts glue. No page islands.
 *   143.4  content route, no form (legal, tools hub, about) = floor + ~1.3
 *          segment router glue (incl. the LeadFormLazy/CalcIslandLazy stubs).
 *   149.5  content route with LeadForm (contact, portal hubs, subpages)
 *          = 143.4 + 6.0 LeadForm island chunk (budget cap 12).
 *   153.8  calculator = 143.4 + 10.4 calc island chunk (CalcIsland +
 *          embedded ResultPanel LeadForm; budget cap 25).
 *
 * Derivations:
 *   base ........... 142.1 floor            + 12.9 headroom = 155
 *   content ........ 149.5 worst (w/ form)  + 12.5 headroom = 162
 *                    (form-less content routes sit ~19 under this ceiling; a
 *                    single-island leak onto them stays below the class
 *                    ceiling — leak-scoping is owned by the lazy-boundary
 *                    imports and the island budget tests, not this gate)
 *   calculator ..... 153.8 floor+islands    + 13.2 headroom = 167
 *   listingReport .. 162 content ceiling + 10 gallery lightbox + 2 map facade
 *                    = 174. Phase 4's known islands per Part 8 island list;
 *                    re-measure and restate when those islands actually land.
 */
export const CEILINGS = {
  base: 155,
  content: 162,
  calculator: 167,
  listingReport: 174,
};

/**
 * Localized section slugs, mirrored from lib/seo/href.ts SECTION_SEG (this
 * script cannot import TS; keep in sync with the route registry).
 */
const CALCULATOR_SECTIONS = new Set(['tools', 'herramientas']);
const LISTING_SECTIONS = new Set(['listings', 'propiedades']);

/**
 * Concrete URL + its srcRoute pattern → budget class, or null for routes with
 * no Part 8 class (framework error shells).
 */
export function classify(url, srcRoute) {
  if (srcRoute === '/_not-found' || srcRoute === '/_global-error') return null;
  if (srcRoute === '/[locale]') return 'base';
  if (srcRoute === '/[locale]/[section]') return 'content';
  // /[locale]/[section]/[sub] and anything deeper: class follows the section slug.
  const section = url.split('/')[2] ?? '';
  if (CALCULATOR_SECTIONS.has(section)) return 'calculator';
  if (LISTING_SECTIONS.has(section)) return 'listingReport';
  return 'content';
}

function fail(msg) {
  console.error(`\n  ✗ bundle-budget: ${msg}\n`);
  process.exit(1);
}

/**
 * All /_next/*.js a browser fetches on first load of a prerendered document:
 *   - <script src> tags (noModule polyfill excluded: module browsers skip it),
 *   - <link rel="preload" as="script"> and <link rel="modulepreload"> hints —
 *     next/dynamic islands rendered during SSR arrive this way (ReactDOM
 *     preload, see PreloadChunks in next/shared/lib/lazy-dynamic): the chunk
 *     is fetched immediately and executed for hydration, so it IS first-load
 *     JS and must be weighed or the gate goes blind to every island.
 */
function firstLoadScripts(html) {
  const srcs = new Set();
  for (const tag of html.match(/<script\b[^>]*>/g) ?? []) {
    if (/\bnomodule\b/i.test(tag)) continue; // legacy polyfill; not fetched by module browsers
    const m = tag.match(/\bsrc="([^"]+)"/);
    if (m && m[1].startsWith('/_next/') && m[1].endsWith('.js')) srcs.add(m[1]);
  }
  for (const tag of html.match(/<link\b[^>]*>/g) ?? []) {
    const preloadsScript =
      /\brel="modulepreload"/.test(tag) ||
      (/\brel="preload"/.test(tag) && /\bas="script"/.test(tag));
    if (!preloadsScript) continue;
    const m = tag.match(/\bhref="([^"]+)"/);
    if (m && m[1].startsWith('/_next/') && m[1].endsWith('.js')) srcs.add(m[1]);
  }
  return [...srcs];
}

function main() {
  // ---- Pre-pass: sanity-check the budget table itself, then exit. ---------
  if (process.argv.includes('--pre')) {
    for (const [k, v] of Object.entries(CEILINGS)) {
      if (typeof v !== 'number' || v <= 0) fail(`ceiling "${k}" is invalid: ${v}`);
    }
    if (CEILINGS.base > CEILINGS.content)
      fail('base ceiling must not exceed content ceiling');
    console.log('  bundle-budget: budget table valid (pre-pass).');
    process.exit(0);
  }

  // ---- Post-pass: weigh every prerendered route and enforce. --------------
  if (!existsSync(join(ROOT, '.next'))) {
    // No build output at all (fresh clone). Postbuild always follows a build,
    // so this only happens when the gate is run standalone; don't fail.
    console.log('  bundle-budget: no .next directory — skipping (run after `next build`).');
    process.exit(0);
  }

  const prerenderPath = join(ROOT, '.next', 'prerender-manifest.json');
  if (!existsSync(prerenderPath))
    fail('.next exists but prerender-manifest.json is missing — broken build output');

  let routes;
  try {
    routes = JSON.parse(readFileSync(prerenderPath, 'utf8')).routes ?? {};
  } catch (err) {
    fail(`could not parse prerender-manifest.json: ${err.message}`);
  }

  const gzCache = new Map();
  const weighChunk = (src) => {
    if (!gzCache.has(src)) {
      const file = join(ROOT, '.next', src.replace(/^\/_next\//, ''));
      if (!existsSync(file)) fail(`chunk referenced in HTML not found on disk: ${src}`);
      gzCache.set(src, gzipSync(readFileSync(file), { level: 9 }).byteLength);
    }
    return gzCache.get(src);
  };

  const weighed = [];
  const skipped = [];
  for (const [url, meta] of Object.entries(routes).sort()) {
    const srcRoute = meta.srcRoute ?? url;
    const cls = classify(url, srcRoute);
    if (cls === null) {
      skipped.push(`${url} (framework shell — no Part 8 class)`);
      continue;
    }
    const htmlPath = join(ROOT, '.next', 'server', 'app', `${url}.html`);
    if (!existsSync(htmlPath)) {
      // Metadata/text routes (robots.txt, sitemap.xml, llms.txt) render no
      // document and ship zero client JS. A missing document for a real page
      // route ([locale] tree) is a broken build, not a skip.
      if (srcRoute.startsWith('/[locale]'))
        fail(`prerendered HTML missing for page route ${url} (expected ${htmlPath})`);
      skipped.push(`${url} (no HTML document — 0 KB client JS)`);
      continue;
    }
    const scripts = firstLoadScripts(readFileSync(htmlPath, 'utf8'));
    const bytes = scripts.reduce((sum, src) => sum + weighChunk(src), 0);
    weighed.push({ url, cls, bytes, ceiling: CEILINGS[cls], chunks: scripts.length });
  }

  if (weighed.length === 0)
    fail('no page routes found to weigh — the gate must never pass on an empty set');

  const w = Math.max(...weighed.map((r) => r.url.length), 5) + 2;
  const line = '─'.repeat(w + 44);
  console.log(`\n  bundle-budget — ${weighed.length} route(s) weighed, first-load JS gzipped\n  ${line}`);
  const breaches = [];
  for (const r of weighed) {
    const kb = r.bytes / 1024;
    const over = kb > r.ceiling;
    if (over) breaches.push(r);
    console.log(
      `  ${r.url.padEnd(w)} ${r.cls.padEnd(14)} ${kb.toFixed(1).padStart(7)} KB  ≤${String(r.ceiling).padEnd(3)} KB  ${over ? '✗ BREACH' : '✓'}`
    );
  }
  console.log(`  ${line}`);
  for (const s of skipped) console.log(`  skipped: ${s}`);
  console.log('');

  if (breaches.length > 0) {
    for (const r of breaches)
      console.error(
        `  ✗ ${r.url} [${r.cls}] ${(r.bytes / 1024).toFixed(1)} KB > ${r.ceiling} KB ceiling`
      );
    fail(`${breaches.length} route(s) exceed their first-load ceiling`);
  }
  process.exit(0);
}

// Run only as a CLI — the test suite imports classify()/CEILINGS from here.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
