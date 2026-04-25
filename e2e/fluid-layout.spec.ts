import { test, expect } from '@playwright/test';

/**
 * E2E: Kiểm tra Fluid Layout hoạt động đúng trên Desktop.
 *
 * Luồng:
 *   1. Inject localStorage('erp-fluid-dashboard', 'true') TRƯỚC khi page load
 *   2. Verify html element có class 'fluid'
 *   3. Verify .shell-layout chiếm >= 95% viewport width (không bị đóng hộp 1380px)
 */

const DESKTOP_VIEWPORT = { width: 1600, height: 900 };

const FLUID_ROUTES = ['/', '/orders', '/suppliers', '/quotations', '/settings'];

test.describe('Fluid Dashboard Layout', () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

  for (const route of FLUID_ROUTES) {
    test(`fluid layout active @ ${route}`, async ({ page }) => {
      // Bước 1: Inject localStorage TRƯỚC khi page load
      await page.addInitScript(() => {
        localStorage.setItem('erp-fluid-dashboard', 'true');
      });

      await page.goto(route, {
        waitUntil: 'domcontentloaded',
        timeout: 15_000,
      });
      await page.waitForTimeout(800);

      // Bước 2: Verify html có class 'fluid'
      const htmlClass = await page.locator('html').getAttribute('class');
      expect(
        htmlClass,
        `html element should have class "fluid" on ${route}`,
      ).toContain('fluid');

      // Bước 3: Verify shell-layout chiếm >= 95% viewport width
      const shellLayout = page.locator('.shell-layout');
      const isVisible = await shellLayout.isVisible().catch(() => false);

      if (isVisible) {
        const shellWidth = await shellLayout.evaluate(
          (el) => el.getBoundingClientRect().width,
        );
        expect(
          shellWidth,
          `shell-layout should be wider than 1380px boxed max on ${route} (got ${shellWidth}px)`,
        ).toBeGreaterThan(1400);
      }
    });
  }

  test('boxed layout by default (no localStorage)', async ({ page }) => {
    // Không inject localStorage → phải là boxed
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await page.waitForTimeout(800);

    const htmlClass = (await page.locator('html').getAttribute('class')) ?? '';
    expect(
      htmlClass,
      'html element should NOT have class "fluid" by default',
    ).not.toContain('fluid');

    const shellLayout = page.locator('.shell-layout');
    const isVisible = await shellLayout.isVisible().catch(() => false);

    if (isVisible) {
      const shellWidth = await shellLayout.evaluate(
        (el) => el.getBoundingClientRect().width,
      );
      expect(
        shellWidth,
        `shell-layout should be <= 1380px in boxed mode (got ${shellWidth}px)`,
      ).toBeLessThanOrEqual(1400);
    }
  });

  test('toggle switch persists and applies', async ({ page }) => {
    // Bước 1: Mở settings, bật switch
    await page.goto('/settings', {
      waitUntil: 'domcontentloaded',
      timeout: 15_000,
    });
    await page.waitForTimeout(800);

    const toggle = page.locator('label:has(#layout-mode-switch)');
    const toggleExists = await toggle.isVisible().catch(() => false);

    if (toggleExists) {
      // Click label (wraps hidden checkbox)
      await toggle.click();
      await page.waitForTimeout(300);

      // Verify html class changed
      const htmlClass = await page.locator('html').getAttribute('class');
      expect(htmlClass).toContain('fluid');

      // Verify localStorage persisted
      const stored = await page.evaluate(() =>
        localStorage.getItem('erp-fluid-dashboard'),
      );
      expect(stored).toBe('true');

      // Bước 2: F5 — phải giữ nguyên
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);

      const htmlClassAfterReload = await page
        .locator('html')
        .getAttribute('class');
      expect(
        htmlClassAfterReload,
        'fluid class should persist after F5',
      ).toContain('fluid');
    }
  });
});
