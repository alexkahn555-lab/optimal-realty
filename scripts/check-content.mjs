#!/usr/bin/env node
/**
 * check-content.mjs — the TK_ gate. Build reference v2.0, Part 3.2.
 *
 * Runs prebuild on every deploy. Scans content/ and config/ for TK_ markers.
 *
 * MODES
 *   report  (default; all preview builds)
 *           Prints per-file TK counts, exits 0. Unfilled slots ship VISIBLY in
 *           previews via <PlaceholderTK>. This is the mode the client reviews in,
 *           and the preview deploy doubles as the discovery instrument.
 *   strict  (CONTENT_STRICT=1; set on production at Phase 6)
 *           Any surviving TK_ marker exits 1 and fails the build.
 *
 * This script is intentionally dependency-free (Node built-ins only) so it runs
 * before `npm install` of app deps if needed and never becomes a build risk itself.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = ['content', 'config'];
const TK_PATTERN = /\bTK_[A-Z0-9_]*/g;
const STRICT = process.env.CONTENT_STRICT === '1';

/** Recursively collect .ts/.tsx files under a directory. */
function collectFiles(dir) {
  const abs = join(ROOT, dir);
  let entries;
  try {
    entries = readdirSync(abs);
  } catch {
    return []; // directory may not exist yet in an early scaffold
  }
  const files = [];
  for (const entry of entries) {
    const full = join(abs, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      files.push(...collectFiles(join(dir, entry)));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

const perFile = [];
let total = 0;

for (const dir of SCAN_DIRS) {
  for (const file of collectFiles(dir)) {
    const text = readFileSync(file, 'utf8');
    const matches = text.match(TK_PATTERN);
    const count = matches ? matches.length : 0;
    if (count > 0) {
      perFile.push({ file: relative(ROOT, file), count });
      total += count;
    }
  }
}

perFile.sort((a, b) => b.count - a.count);

const mode = STRICT ? 'STRICT' : 'report';
console.log(`\n  check-content.mjs — mode: ${mode}\n  ${'─'.repeat(46)}`);

if (perFile.length === 0) {
  console.log('  No TK_ markers found.\n');
} else {
  for (const { file, count } of perFile) {
    console.log(`  ${file.padEnd(42)} ${String(count).padStart(3)} TK`);
  }
  console.log(`  ${'─'.repeat(46)}`);
  console.log(
    `  TOTAL  ${total} TK markers across ${perFile.length} file${perFile.length === 1 ? '' : 's'}\n`
  );
}

if (STRICT && total > 0) {
  console.error(
    `  ✗ STRICT MODE: ${total} TK_ marker(s) remain. Production build blocked.\n` +
      `    A launch cannot ship a placeholder. Fill or set the entities to draft.\n`
  );
  process.exit(1);
}

process.exit(0);
