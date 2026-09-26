import { describe, it, expect } from 'vitest';

import {
  isValidPrintSubTab,
  resolvePrintSubTab,
} from './print-settings-tab.utils';

describe('print-settings-tab.utils', () => {
  describe('isValidPrintSubTab', () => {
    it('returns true for valid tab keys', () => {
      expect(isValidPrintSubTab('config')).toBe(true);
      expect(isValidPrintSubTab('templates')).toBe(true);
    });

    it('returns false for invalid values', () => {
      expect(isValidPrintSubTab('random')).toBe(false);
      expect(isValidPrintSubTab('')).toBe(false);
      expect(isValidPrintSubTab(null)).toBe(false);
      expect(isValidPrintSubTab(undefined)).toBe(false);
    });
  });

  describe('resolvePrintSubTab', () => {
    it('prioritizes valid search query over pathname', () => {
      expect(resolvePrintSubTab('/settings/print-templates', 'config')).toBe(
        'config',
      );
      expect(resolvePrintSubTab('/settings/print', 'templates')).toBe(
        'templates',
      );
    });

    it('falls back to pathname when search query is null or invalid', () => {
      expect(resolvePrintSubTab('/settings/print', null)).toBe('config');
      expect(resolvePrintSubTab('/settings/print', 'invalid_tab')).toBe(
        'config',
      );
      expect(resolvePrintSubTab('/settings/print-templates', null)).toBe(
        'templates',
      );
      expect(
        resolvePrintSubTab('/settings/print-templates', 'invalid_tab'),
      ).toBe('templates');
    });

    it('defaults to config when pathname is general settings', () => {
      expect(resolvePrintSubTab('/settings/general', null)).toBe('config');
      expect(resolvePrintSubTab('/', null)).toBe('config');
    });
  });
});
