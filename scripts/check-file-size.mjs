#!/usr/bin/env node
/**
 * check-file-size.mjs — Rule 11 (component size) enforcement.
 *
 * ESLint has no notion of a "baseline", so `max-lines` cannot be enabled without
 * instantly failing on the ~150 files that already exceed 300 lines. This script
 * enforces the rule as a one-way RATCHET instead:
 *
 *   - A file already in the baseline may not GROW.
 *   - A file NOT in the baseline may not exceed the limit at all.
 *   - Shrinking is always allowed, and the win is recorded.
 *
 * Run:  node scripts/check-file-size.mjs
 *       node scripts/check-file-size.mjs --update-baseline   (after a real refactor)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIMIT = 300;
const BASELINE_PATH = path.join(ROOT, 'scripts', 'file-size-baseline.json');

const SCAN_DIRS = ['src', 'server/src', 'agent/src'];
const IGNORE = [
  /\.d\.ts$/,
  /(^|\/)node_modules\//,
  /(^|\/)dist\//,
  // Supabase CLI / generated output — not hand-maintained, not subject to Rule 11
  /(^|\/)database\.types\.ts$/,
  /(^|\/)drizzle\/migrations\//,
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full).split(path.sep).join('/');
    if (IGNORE.some((re) => re.test(rel))) continue;
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(rel);
  }
  return out;
}

function countLines(rel) {
  const text = fs.readFileSync(path.join(ROOT, rel), 'utf-8');
  // Count logical lines; a trailing newline does not start a new line.
  const lines = text.split('\n');
  return lines[lines.length - 1] === '' ? lines.length - 1 : lines.length;
}

const current = {};
for (const rel of SCAN_DIRS.flatMap((d) => walk(path.join(ROOT, d)))) {
  const lines = countLines(rel);
  if (lines > LIMIT) current[rel] = lines;
}

const update = process.argv.includes('--update-baseline');

if (update) {
  const sorted = Object.fromEntries(
    Object.entries(current).sort(([a], [b]) => a.localeCompare(b)),
  );
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(sorted, null, 2) + '\n');
  console.log(`✅ Baseline updated: ${Object.keys(sorted).length} file(s) over ${LIMIT} lines.`);
  process.exit(0);
}

if (!fs.existsSync(BASELINE_PATH)) {
  console.error(`❌ Missing baseline: ${path.relative(ROOT, BASELINE_PATH)}`);
  console.error('   Create it once with: node scripts/check-file-size.mjs --update-baseline');
  process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf-8'));
const problems = [];

for (const [rel, lines] of Object.entries(current)) {
  const allowed = baseline[rel];
  if (allowed === undefined) {
    problems.push(
      `[NEW OVERSIZED] ${rel} — ${lines} lines (limit ${LIMIT}). Refactor or split; do not add to the baseline.`,
    );
  } else if (lines > allowed) {
    const delta = lines - allowed;
    problems.push(
      `[GREW] ${rel} — ${lines} lines, was ${allowed} (+${delta}). This file is already over the limit; do not grow it.`,
    );
  }
}

console.log('\n📏 File Size Ratchet (Rule 11)');
console.log('─'.repeat(50));
console.log(`   Limit: ${LIMIT} lines · over limit: ${Object.keys(current).length} file(s) · baseline: ${Object.keys(baseline).length}`);

if (problems.length > 0) {
  console.error(`\n❌ ${problems.length} problem(s):\n`);
  for (const p of problems) console.error(`   ${p}`);
  console.error('\n💡 Extract logic into a service/hook, or split into sub-components.');
  console.error('   Do NOT bulk-split unrelated large files — that is outside your task scope.');
  process.exit(1);
}

const improved = Object.entries(baseline).filter(([rel, was]) => {
  const now = current[rel];
  return now === undefined || now < was;
});
console.log('✅ No file grew past its baseline.');
if (improved.length > 0) {
  console.log(`\n🎉 ${improved.length} file(s) now below baseline:`);
  for (const [rel, was] of improved) {
    console.log(`   ${rel}: ${was} → ${current[rel] ?? 'under limit'}`);
  }
  console.log('   Run with --update-baseline to record the improvement.');
}
