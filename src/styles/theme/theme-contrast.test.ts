import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * WCAG 2.1 AA contrast regression guards for semantic color tokens.
 *
 * Reads the real token sources (light `theme/tokens.css`, dark
 * `theme/dark-mode.css`) and asserts that status text keeps a >= 4.5:1
 * ratio on its soft/composited backgrounds. Guard added after the warning
 * token (#d97706) fell to 2.86:1 on the customer portal packing-list badge.
 */

type Rgb = [number, number, number];

const TOKENS = path.resolve(process.cwd(), 'src/styles/theme/tokens.css');
const DARK = path.resolve(process.cwd(), 'src/styles/theme/dark-mode.css');

/** Loads every `--name: value;` declaration from a stylesheet into a map. */
function loadVars(file: string): Map<string, string> {
  const map = new Map<string, string>();
  const re = /--([\w-]+)\s*:\s*([^;]+);/g;
  const css = readFileSync(file, 'utf8');
  let m: RegExpExecArray | null;
  while ((m = re.exec(css))) map.set(m[1]!, m[2]!.trim());
  return map;
}

function resolveRaw(vars: Map<string, string>, name: string): string {
  const raw = vars.get(name);
  if (!raw) throw new Error(`Token --${name} not found`);
  return raw.replace(/var\(--([\w-]+)\)/g, (_, ref: string) =>
    resolveRaw(vars, ref),
  );
}

function readVar(file: string, name: string): Rgb {
  return parseColor(resolveRaw(loadVars(file), name));
}

function parseColor(value: string): Rgb {
  if (value.startsWith('#')) {
    const hex = value.slice(1);
    const full =
      hex.length === 3
        ? hex
            .split('')
            .map((c) => c + c)
            .join('')
        : hex;
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
    ];
  }
  const rgba = value.match(/rgba?\(([^)]+)\)/);
  if (!rgba) throw new Error(`Unsupported color format: ${value}`);
  const parts = rgba[1]!.split(',').map((p) => parseFloat(p.trim()));
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

function parseAlpha(value: string): number {
  const rgba = value.match(/rgba\(([^)]+)\)/);
  if (!rgba) return 1;
  const parts = rgba[1]!.split(',').map((p) => parseFloat(p.trim()));
  return parts.length > 3 ? (parts[3] ?? 1) : 1;
}

/** Composits a (possibly translucent) foreground over an opaque background. */
function composit(fg: Rgb, alpha: number, bg: Rgb): Rgb {
  return [
    Math.round(alpha * fg[0] + (1 - alpha) * bg[0]),
    Math.round(alpha * fg[1] + (1 - alpha) * bg[1]),
    Math.round(alpha * fg[2] + (1 - alpha) * bg[2]),
  ];
}

function channelLuminance(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]: Rgb): number {
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

function contrastRatio(a: Rgb, b: Rgb): number {
  const hi = Math.max(luminance(a), luminance(b));
  const lo = Math.min(luminance(a), luminance(b));
  return (hi + 0.05) / (lo + 0.05);
}

const AA_NORMAL = 4.5;

describe('WCAG token contrast — light mode', () => {
  const white: Rgb = [255, 255, 255];
  const surfaceStrong = readVar(TOKENS, 'surface-strong');
  const surfaceSecondary = readVar(TOKENS, 'surface-secondary');
  const foreground = readVar(TOKENS, 'foreground');
  const muted = readVar(TOKENS, 'muted-foreground');
  const warning = readVar(TOKENS, 'warning');
  const warningSoft = readVar(TOKENS, 'warning-soft');
  const success = readVar(TOKENS, 'success');
  const successSoft = readVar(TOKENS, 'success-soft');

  it('keeps body text readable on strong and secondary surfaces', () => {
    expect(contrastRatio(foreground, surfaceStrong)).toBeGreaterThanOrEqual(
      AA_NORMAL,
    );
    expect(contrastRatio(muted, surfaceStrong)).toBeGreaterThanOrEqual(
      AA_NORMAL,
    );
    expect(contrastRatio(muted, surfaceSecondary)).toBeGreaterThanOrEqual(
      AA_NORMAL,
    );
  });

  it('keeps warning status text readable on its soft background', () => {
    // Portal badge renders the full soft fill; matrix cells use it at 20%.
    expect(contrastRatio(warning, warningSoft)).toBeGreaterThanOrEqual(
      AA_NORMAL,
    );
    const cell = composit(warningSoft, 0.2, white);
    expect(contrastRatio(warning, cell)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it('keeps grade-A weight text readable on its soft background', () => {
    const cell = composit(successSoft, 0.2, white);
    expect(contrastRatio(success, cell)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
});

describe('WCAG token contrast — dark mode', () => {
  const surfaceStrong = readVar(DARK, 'surface-strong');
  const muted = readVar(DARK, 'muted-foreground');
  const warning = readVar(DARK, 'warning');

  function readDarkVar(name: string): { rgb: Rgb; alpha: number } {
    const raw = resolveRaw(loadVars(DARK), name);
    return { rgb: parseColor(raw), alpha: parseAlpha(raw) };
  }

  it('keeps muted text readable on dark surfaces', () => {
    expect(contrastRatio(muted, surfaceStrong)).toBeGreaterThanOrEqual(
      AA_NORMAL,
    );
  });

  it('keeps warning status text readable on its soft background', () => {
    const soft = readDarkVar('warning-soft');
    const bg = composit(soft.rgb, soft.alpha, surfaceStrong);
    expect(contrastRatio(warning, bg)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
});

describe('WCAG token contrast — fixed dark surfaces (auth)', () => {
  // Auth pages keep a dark backdrop (--auth-bg) in BOTH themes, so their text
  // token must not flip with the theme. Regression guard: --inverse-foreground
  // turns #091524 in dark mode, which collapses into that backdrop (~1.0:1).
  const authBg = {
    light: readVar(TOKENS, 'auth-bg'),
    dark: readVar(DARK, 'auth-bg'),
  };

  it('declares the theme-invariant text token in both themes', () => {
    expect(() => readVar(TOKENS, 'on-dark-foreground')).not.toThrow();
    expect(() => readVar(DARK, 'on-dark-foreground')).not.toThrow();
  });

  it('keeps auth text readable on the dark backdrop in both themes', () => {
    expect(
      contrastRatio(readVar(TOKENS, 'on-dark-foreground'), authBg.light),
    ).toBeGreaterThanOrEqual(AA_NORMAL);
    expect(
      contrastRatio(readVar(DARK, 'on-dark-foreground'), authBg.dark),
    ).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it('would break if the auth text token flipped with the theme', () => {
    // Documents the exact defect this token exists to prevent: reusing the
    // theme-flipping token on the fixed-dark auth backdrop.
    expect(
      contrastRatio(readVar(DARK, 'inverse-foreground'), authBg.dark),
    ).toBeLessThan(AA_NORMAL);
  });
});

/**
 * Loom status badges (LoomCompactCard) previously paired pale `bg-X-soft`
 * fills with `text-inverse-foreground` — white in light mode, #091524 in dark
 * mode — giving 1.00-1.48:1, i.e. invisible in BOTH themes. They now use a
 * solid fill with the inverse foreground, the same pairing as btn-primary.
 */
describe('loom status badge contrast', () => {
  type Pair = { inverse: string; solid: string };

  const PAIRS: Record<string, Pair> = {
    running: { inverse: 'inverse-foreground', solid: 'success' },
    maintenance: { inverse: 'inverse-foreground', solid: 'warning' },
    breakdown: { inverse: 'inverse-foreground', solid: 'danger' },
    setup: { inverse: 'inverse-foreground', solid: 'purple' },
  };

  it('keeps every loom status readable in light mode', () => {
    for (const [status, pair] of Object.entries(PAIRS)) {
      const fg = readVar(TOKENS, pair.inverse);
      const bg = readVar(TOKENS, pair.solid);
      expect(
        contrastRatio(fg, bg),
        `${status} (light): text-${pair.inverse} on bg-${pair.solid}`,
      ).toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });

  it('keeps every loom status readable in dark mode', () => {
    for (const [status, pair] of Object.entries(PAIRS)) {
      const fg = readVar(DARK, pair.inverse);
      const bg = readVar(DARK, pair.solid);
      expect(
        contrastRatio(fg, bg),
        `${status} (dark): text-${pair.inverse} on bg-${pair.solid}`,
      ).toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });

  it('keeps the idle status readable on its neutral surface', () => {
    expect(
      contrastRatio(
        readVar(TOKENS, 'muted-foreground'),
        readVar(TOKENS, 'surface-secondary'),
      ),
    ).toBeGreaterThanOrEqual(AA_NORMAL);

    // Dark --surface-secondary is translucent, so composite it over the page.
    const raw = resolveRaw(loadVars(DARK), 'surface-secondary');
    const onPage = composit(
      parseColor(raw),
      parseAlpha(raw),
      readVar(DARK, 'background'),
    );
    expect(
      contrastRatio(readVar(DARK, 'muted-foreground'), onPage),
    ).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it('keeps inverse text readable on every solid status fill', () => {
    // Shared pattern: text-inverse-foreground on a solid brand/status colour.
    // Used by buttons, badges and the error boundaries after the audit.
    const solids = ['success', 'danger', 'warning', 'info', 'purple', 'primary'];
    for (const theme of [
      { label: 'light', file: TOKENS },
      { label: 'dark', file: DARK },
    ]) {
      const fg = readVar(theme.file, 'inverse-foreground');
      for (const solid of solids) {
        expect(
          contrastRatio(fg, readVar(theme.file, solid)),
          `${solid} (${theme.label}): inverse-foreground on ${solid}`,
        ).toBeGreaterThanOrEqual(AA_NORMAL);
      }
    }
  });

  it('registers the reported regression: inverse-foreground on pale fills', () => {
    // White on the light soft fills is what made the badges unreadable.
    expect(
      contrastRatio(
        readVar(TOKENS, 'inverse-foreground'),
        readVar(TOKENS, 'success-soft'),
      ),
    ).toBeLessThan(AA_NORMAL);
  });
});
