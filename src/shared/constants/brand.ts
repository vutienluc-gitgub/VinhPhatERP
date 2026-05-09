/**
 * Brand Design Tokens — Single Source of Truth for JS/TS code.
 *
 * These mirror the CSS custom properties in `src/styles/global.css`.
 * When you rebrand, update BOTH this file and global.css.
 *
 * Usage:
 *   import { BRAND } from '@/shared/constants/brand';
 *   background: BRAND.primary;
 */

export const BRAND = {
  /** Primary blue — #2151A1 */
  primary: '#2151A1',
  /** Darker primary — #163870 */
  primaryStrong: '#163870',
  /** Accent red — #EB1933 */
  accent: '#EB1933',
  /** Dark navy text — #101E34 */
  text: '#101E34',
  /** White surface */
  white: '#FFFFFF',

  /** Success green */
  success: '#0a805c',
  /** Danger red */
  danger: '#c0392b',
  /** Warning amber */
  warning: '#d97706',
} as const;

/** Hex colors used in PDF/Excel export templates */
export const EXPORT_COLORS = {
  headerBg: BRAND.primary,
  headerBorder: BRAND.primary,
  headerText: BRAND.white,
  stripeBg: '#f5f8fc',
  cellBorder: '#d0dae8',
} as const;
