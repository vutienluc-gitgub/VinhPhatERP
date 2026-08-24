import { describe, expect, it } from 'vitest';

import {
  printSettingsSchema,
  printSettingsDefaults,
} from './company-settings.schema';

describe('printSettingsSchema', () => {
  it('validates default settings successfully', () => {
    const parsed = printSettingsSchema.safeParse(printSettingsDefaults);
    expect(parsed.success).toBe(true);
  });

  it('validates A4 format with optional orientation', () => {
    const result = printSettingsSchema.safeParse({
      print_default_format: 'A4',
      print_orientation: 'LANDSCAPE',
      print_show_logo: true,
      print_show_qr: false,
      print_footer_note: 'Test footer note',
    });
    expect(result.success).toBe(true);
  });

  it('validates A5_DOT_MATRIX format with custom dimensions', () => {
    const result = printSettingsSchema.safeParse({
      print_default_format: 'A5_DOT_MATRIX',
      print_dot_matrix_width: '200mm',
      print_dot_matrix_height: '145mm',
      print_show_logo: true,
      print_show_qr: true,
      print_footer_note: 'Ghi chú',
    });
    expect(result.success).toBe(true);
  });

  it('fails when A5_DOT_MATRIX is selected but dimensions are missing', () => {
    const result = printSettingsSchema.safeParse({
      print_default_format: 'A5_DOT_MATRIX',
      print_dot_matrix_width: '',
      print_dot_matrix_height: '',
      print_show_logo: true,
      print_show_qr: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issuePaths = result.error.issues.map((i) => i.path.join('.'));
      expect(issuePaths).toContain('print_dot_matrix_width');
      expect(issuePaths).toContain('print_dot_matrix_height');
    }
  });

  it('fails when dimension format is invalid', () => {
    const result = printSettingsSchema.safeParse({
      print_default_format: 'A5_DOT_MATRIX',
      print_dot_matrix_width: '200px', // not mm or cm
      print_dot_matrix_height: '145mm',
      print_show_logo: true,
      print_show_qr: true,
    });
    expect(result.success).toBe(false);
  });

  it('fails when footer note exceeds 500 characters', () => {
    const longText = 'a'.repeat(501);
    const result = printSettingsSchema.safeParse({
      ...printSettingsDefaults,
      print_footer_note: longText,
    });
    expect(result.success).toBe(false);
  });
});
