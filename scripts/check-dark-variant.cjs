/**
 * Guards against Tailwind `dark:` utilities in the codebase.
 *
 * The app switches theme by setting `data-theme="dark"` on <html>
 * (see src/shared/utils/theme-utils.ts). Tailwind's built-in `dark:` variant,
 * however, compiles to `@media (prefers-color-scheme: dark)` — it follows the
 * operating system, not the in-app toggle. The two mechanisms never agree, so
 * a `dark:` utility silently desyncs: it can fire while the app is in light
 * mode (system dark, app light) and never fires when the app is in dark mode
 * on a light OS.
 *
 * Theme-aware semantic tokens (--surface-strong, --*-soft, --muted-foreground,
 * ...) already redefine themselves under [data-theme='dark'], so `dark:` is
 * redundant on top of being wrong.
 *
 * Escape hatch: add `@dark-variant-exception` on the line to opt out.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src');

// A `dark:` utility: preceded by whitespace/quote/backtick, followed directly
// by a utility name (not whitespace, which would make it an object key such as
// `color: { dark: '#000' }`).
const UTILITY_RE = /(?<=[\s"'`])dark:[a-zA-Z][\w:./[\]%-]*/g;
const EXCEPTION = '@dark-variant-exception';

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      out.push(...walk(full));
    } else if (/\.(tsx|jsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const hits = [];
for (const file of walk(ROOT)) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (line.includes(EXCEPTION)) return;
    const matches = line.match(UTILITY_RE);
    if (matches) {
      hits.push({
        file: path.relative(ROOT, file),
        line: i + 1,
        classes: [...new Set(matches)],
      });
    }
  });
}

console.log('🌗 Dark Variant Guard');
console.log('────────────────────────────────────────');

if (hits.length > 0) {
  console.error(
    `❌ Found ${hits.length} line(s) using the OS-bound \`dark:\` variant:\n`,
  );
  for (const hit of hits) {
    console.error(`   ${hit.file}:${hit.line}  ${hit.classes.join(' ')}`);
  }
  console.error(
    '\n🚨 `dark:` compiles to @media (prefers-color-scheme), but this app themes',
  );
  console.error(
    "   via [data-theme='dark']. Use semantic tokens (they already adapt to",
  );
  console.error(
    '   the in-app theme) or add @dark-variant-exception if truly intended.',
  );
  process.exit(1);
}

console.log('✅ No OS-bound `dark:` utilities found.');
process.exit(0);
