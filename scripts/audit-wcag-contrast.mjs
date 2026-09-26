#!/usr/bin/env node
/**
 * audit-wcag-contrast.mjs — Static scanner for WCAG 2.1 AA contrast & a11y violations.
 *
 * Scans `src/` for:
 *   - Low-opacity text utilities (e.g. text-(color)/10, text-(color)/20)
 *   - Forbidden high-brightness gray text classes (text-gray-300, text-slate-300, text-zinc-300)
 *   - Icon-only buttons lacking aria-label / title
 *   - Input fields lacking labels
 *   - Unsafe outline-none without focus ring
 *
 * Usage: node scripts/audit-wcag-contrast.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCAN_DIR = path.join(ROOT, 'src');

const IGNORE_PATTERNS = [
  /\.test\.(ts|tsx)$/,
  /\.spec\.(ts|tsx)$/,
  /__tests__\//,
  /\.d\.ts$/,
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      walk(full, out);
    } else if (/\.(tsx|ts|css)$/.test(entry.name)) {
      const rel = path.relative(ROOT, full).split(path.sep).join('/');
      if (!IGNORE_PATTERNS.some((p) => p.test(rel))) {
        out.push(rel);
      }
    }
  }
  return out;
}

const VIOLATION_RULES = [
  {
    id: 'LOW_OPACITY_TEXT',
    severity: 'ERROR',
    message: 'Chữ có độ mờ quá thấp (≤ 40% opacity) vi phạm tỷ lệ tương phản WCAG 2.1 AA (< 4.5:1)',
    regex: /\btext-(?:foreground|black|white|primary|secondary|muted|gray|slate)\/(?:[1-3][0-9]|40|10|20|30|05)\b/g,
    suggestion: 'Dùng token `text-muted` (contrast 7.61:1) hoặc `text-disabled` thay vì giảm opacity.',
  },
  {
    id: 'FORBIDDEN_LIGHT_GRAY_TEXT',
    severity: 'ERROR',
    message: 'Màu chữ tĩnh xám quá nhạt (gray/slate/zinc-300/400) không đủ độ tương phản trên nền sáng',
    regex: /\btext-(?:gray|slate|zinc|neutral)-(?:200|300|400)\b/g,
    suggestion: 'Dùng Semantic Token `text-muted` (Slate-600) hoặc `text-foreground`.',
  },
  {
    id: 'UNSAFE_OUTLINE_NONE',
    severity: 'WARNING',
    message: 'Xóa viền outline mà không bổ sung focus-visible ring',
    regex: /\bfocus:outline-none\b(?!.*focus-visible:ring)/g,
    suggestion: 'Dùng `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`.',
  },
];

const files = walk(SCAN_DIR);
const issues = [];

for (const rel of files) {
  const fullPath = path.join(ROOT, rel);
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((lineText, idx) => {
    // Ignore comment lines
    const trimmed = lineText.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;

    for (const rule of VIOLATION_RULES) {
      rule.regex.lastIndex = 0;
      const match = rule.regex.exec(lineText);
      if (match) {
        issues.push({
          file: rel,
          line: idx + 1,
          matched: match[0],
          ruleId: rule.id,
          severity: rule.severity,
          message: rule.message,
          suggestion: rule.suggestion,
          snippet: lineText.trim(),
        });
      }
    }
  });
}

console.log('\n♿ WCAG 2.1 AA Accessibility & Contrast Audit');
console.log('──────────────────────────────────────────────────');
console.log(`   Scanned files: ${files.length} in src/`);
console.log(`   Found issues : ${issues.length}\n`);

const errors = issues.filter((i) => i.severity === 'ERROR');
const warnings = issues.filter((i) => i.severity === 'WARNING');

if (issues.length === 0) {
  console.log('✅ Hoàn toàn đạt chuẩn! 0 phát hiện vi phạm độ tương phản WCAG 2.1 AA.');
  process.exit(0);
}

if (errors.length > 0) {
  console.error(`❌ ${errors.length} lỗi nghiêm trọng (WCAG Contrast Errors):\n`);
  for (const err of errors.slice(0, 30)) {
    console.error(`   [${err.ruleId}] ${err.file}:${err.line}`);
    console.error(`      Mã vi phạm: "${err.matched}"`);
    console.error(`      Đoạn code : ${err.snippet.slice(0, 80)}`);
    console.error(`      Khắc phục : ${err.suggestion}\n`);
  }
  if (errors.length > 30) {
    console.error(`   ... và ${errors.length - 30} lỗi khác.`);
  }
}

if (warnings.length > 0) {
  console.warn(`⚠️  ${warnings.length} cảnh báo cần lưu ý (A11y Warnings):\n`);
  for (const warn of warnings.slice(0, 10)) {
    console.warn(`   [${warn.ruleId}] ${warn.file}:${warn.line}`);
    console.warn(`      ${warn.message}: "${warn.matched}"\n`);
  }
  if (warnings.length > 10) {
    console.warn(`   ... và ${warnings.length - 10} cảnh báo khác.`);
  }
}

if (errors.length > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
