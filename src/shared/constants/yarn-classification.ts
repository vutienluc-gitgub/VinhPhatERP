/**
 * Yarn Classification Constants
 *
 * Centralized definitions for the hierarchical yarn classification system:
 *   Level 1 — Category (Material / Chất liệu)
 *   Level 2 — Core Yarn Type (Nhóm kỹ thuật chính)
 */

// ─── Level 1: Category (Chất liệu) ─────────────────────────────────────────

export const YARN_CATEGORIES = [
  { code: 'Polyester', label: 'Polyester' },
  { code: 'Nylon', label: 'Nylon' },
  { code: 'Cotton', label: 'Cotton' },
  { code: 'Rayon', label: 'Rayon / Viscose' },
  { code: 'Blend', label: 'Blend (Poly Cotton, TC, CVC...)' },
  { code: 'Functional', label: 'Functional' },
  { code: 'Fancy', label: 'Fancy' },
] as const;

export const YARN_CATEGORY_OPTIONS = YARN_CATEGORIES.map((c) => ({
  value: c.code,
  label: c.label,
}));

// ─── Level 2: Core Yarn Type (Nhóm kỹ thuật chính) ─────────────────────────

export const YARN_TYPES = [
  // Filament Yarn
  { code: 'DTY', label: 'DTY — Draw Textured Yarn' },
  { code: 'FDY', label: 'FDY — Fully Drawn Yarn' },
  { code: 'POY', label: 'POY — Partially Oriented Yarn' },
  { code: 'ATY', label: 'ATY — Air Textured Yarn' },
  { code: 'ITY', label: 'ITY — Interlaced Textured Yarn' },
  { code: 'CDP', label: 'CDP — Cationic Dyeable Polyester' },

  // Covered Yarn
  { code: 'SPX', label: 'SPX — Spandex' },
  { code: 'SCY', label: 'SCY — Single Covered Yarn' },
  { code: 'RCY', label: 'RCY — Reverse Covered Yarn' },
  { code: 'ACY', label: 'ACY — Air Covered Yarn' },
  { code: 'DCY', label: 'DCY — Double Covered Yarn' },

  // Spun Yarn
  { code: 'SPN', label: 'SPN — Spun Yarn (Ring / Vortex)' },
  { code: 'OE', label: 'OE — Open-End Yarn' },
  { code: 'CM', label: 'CM — Combed Yarn' },
  { code: 'CD', label: 'CD — Carded Yarn' },

  // Special
  { code: 'MET', label: 'MET — Metallic Yarn' },
  { code: 'SPC', label: 'SPC — Special Yarn' },
] as const;

export const YARN_TYPE_OPTIONS = YARN_TYPES.map((t) => ({
  value: t.code,
  label: t.label,
}));

/** Lookup map: code → full label. Returns the code itself if not found. */
export const YARN_TYPE_LABEL_MAP: Record<string, string> = Object.fromEntries(
  YARN_TYPES.map((t) => [t.code, t.label]),
);

export function getYarnTypeLabel(code: string | null | undefined): string {
  if (!code) return '';
  return YARN_TYPE_LABEL_MAP[code] ?? code;
}

export const YARN_CATEGORY_LABEL_MAP: Record<string, string> =
  Object.fromEntries(YARN_CATEGORIES.map((c) => [c.code, c.label]));

export function getYarnCategoryLabel(code: string | null | undefined): string {
  if (!code) return '';
  return YARN_CATEGORY_LABEL_MAP[code] ?? code;
}

// ─── Finish (Hiệu ứng bề mặt) ─────────────────────────────────────────────

export const YARN_FINISHES = [
  { code: 'bright', label: 'Bright' },
  { code: 'semi_dull', label: 'Semi Dull' },
  { code: 'full_dull', label: 'Full Dull' },
  { code: 'trilobal_bright', label: 'Trilobal Bright' },
] as const;

export const YARN_FINISH_OPTIONS = YARN_FINISHES.map((f) => ({
  value: f.code,
  label: f.label,
}));

// ─── Color Status (Trạng thái màu) ─────────────────────────────────────────

export const YARN_COLOR_STATUSES = [
  { code: 'raw_white', label: 'Raw White' },
  { code: 'dope_dyed', label: 'Dope Dyed' },
  { code: 'dyed', label: 'Dyed' },
] as const;

export const YARN_COLOR_STATUS_OPTIONS = YARN_COLOR_STATUSES.map((s) => ({
  value: s.code,
  label: s.label,
}));

// ─── Common Denier Presets ──────────────────────────────────────────────────

export const YARN_DENIER_PRESETS = [
  '20D',
  '30D',
  '40D',
  '50D',
  '70D',
  '75D',
  '100D',
  '150D',
  '200D',
  '300D',
  '450D',
  '600D',
] as const;

export const YARN_DENIER_OPTIONS = YARN_DENIER_PRESETS.map((d) => ({
  value: d,
  label: d,
}));

// ─── Common Filament Count Presets ──────────────────────────────────────────

export const YARN_FILAMENT_PRESETS = [
  '12F',
  '24F',
  '36F',
  '48F',
  '72F',
  '96F',
  '144F',
  '288F',
] as const;

export const YARN_FILAMENT_OPTIONS = YARN_FILAMENT_PRESETS.map((f) => ({
  value: f,
  label: f,
}));
