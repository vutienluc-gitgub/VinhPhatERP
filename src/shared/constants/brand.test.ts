import { describe, expect, it } from 'vitest';

import {
  BRAND_COLORS,
  BRAND_INFO,
  LOGO_MIN_SIZES,
  VP_SYMBOL_PATH_DATA,
  getBrandAssetUrl,
} from './brand';

describe('Brand Identity Standards v3.0 Constants', () => {
  it('defines the official Viettel Red brand color', () => {
    expect(BRAND_COLORS.PRIMARY).toBe('#EE0033');
    expect(BRAND_COLORS.BLACK).toBe('#000000');
    expect(BRAND_COLORS.WHITE).toBe('#FFFFFF');
  });

  it('defines accurate brand texts according to guidelines', () => {
    expect(BRAND_INFO.COMPANY_NAME).toBe('DỆT MAY VĨNH PHÁT');
    expect(BRAND_INFO.BRAND_NAME).toBe('Vĩnh Phát');
    expect(BRAND_INFO.SLOGAN).toBe('Mỗi tấm vải - Một tấm lòng');
    expect(BRAND_INFO.VERSION).toBe('3.0');
  });

  it('preserves minimum sizes per specification', () => {
    // Full Logo
    expect(LOGO_MIN_SIZES.FULL.digitalWidth).toBe(120);
    expect(LOGO_MIN_SIZES.FULL.digitalHeight).toBe(60);
    expect(LOGO_MIN_SIZES.FULL.printWidthMm).toBe(30);
    expect(LOGO_MIN_SIZES.FULL.printHeightMm).toBe(15);

    // Compact Logo
    expect(LOGO_MIN_SIZES.COMPACT.digitalWidth).toBe(60);
    expect(LOGO_MIN_SIZES.COMPACT.digitalHeight).toBe(40);
    expect(LOGO_MIN_SIZES.COMPACT.printWidthMm).toBe(15);
    expect(LOGO_MIN_SIZES.COMPACT.printHeightMm).toBe(10);

    // Symbol Only
    expect(LOGO_MIN_SIZES.SYMBOL.digitalWidth).toBe(32);
    expect(LOGO_MIN_SIZES.SYMBOL.digitalHeight).toBe(32);
    expect(LOGO_MIN_SIZES.SYMBOL.printWidthMm).toBe(8);
    expect(LOGO_MIN_SIZES.SYMBOL.printHeightMm).toBe(8);
  });

  it('contains valid non-empty vector path for VP symbol', () => {
    expect(VP_SYMBOL_PATH_DATA).toBeDefined();
    expect(VP_SYMBOL_PATH_DATA.startsWith('m2245.56 895.61')).toBe(true);
  });

  it('maps asset paths correctly for each layout and variant', () => {
    // Symbol
    expect(getBrandAssetUrl('symbol', 'positive')).toBe(
      '/brand/logo-symbol-positive.svg',
    );
    expect(getBrandAssetUrl('symbol', 'negative')).toBe(
      '/brand/logo-symbol-negative.svg',
    );
    expect(getBrandAssetUrl('symbol', 'monochrome', 'black')).toBe(
      '/brand/logo-symbol-monochrome-black.svg',
    );
    expect(getBrandAssetUrl('symbol', 'monochrome', 'white')).toBe(
      '/brand/logo-symbol-monochrome-white.svg',
    );

    // Compact
    expect(getBrandAssetUrl('compact', 'positive')).toBe(
      '/brand/logo-compact-positive.svg',
    );
    expect(getBrandAssetUrl('compact', 'negative')).toBe(
      '/brand/logo-compact-negative.svg',
    );
    expect(getBrandAssetUrl('compact', 'monochrome')).toBe(
      '/brand/logo-compact-monochrome.svg',
    );

    // Full
    expect(getBrandAssetUrl('full', 'positive')).toBe(
      '/brand/logo-full-positive.svg',
    );
    expect(getBrandAssetUrl('full', 'negative')).toBe(
      '/brand/logo-full-negative.svg',
    );
    expect(getBrandAssetUrl('full', 'monochrome')).toBe(
      '/brand/logo-full-monochrome.svg',
    );
  });
});
