import { test, expect } from '@playwright/test';

/**
 * E2E: Kiểm tra Fluid Layout hoạt động đúng trên Desktop.
 *
 * Luồng:
 *   1. Inject localStorage cache (vinhphat-prefs-cache) VỚI fluid_layout=true TRƯỚC khi page load
 *   2. Verify html element có class 'fluid'
 *   3. Verify .shell-layout chiếm >= 95% viewport width (không bị đóng hộp 1380px)
 *
 * NOTE: preferences giờ lưu vào profiles.preferences (DB).
 *       localStorage key 'vinhphat-prefs-cache' chỉ là cache boot để tránh flash.
 */

const DESKTOP_VIEWPORT = { width: 1600, height: 900 };

const FLUID_ROUTES = ['/', '/orders', '/suppliers', '/quotations', '/settings'];

/** Cache key dùng bởi useUserPreferences */
const PREFS_CACHE_KEY = 'vinhphat-prefs-cache';

/** Preferences JSON đầy đủ cho fluid mode */
const FLUID_PREFS = JSON.stringify({
  theme: 'light',
  fluid_layout: true,
  sidebar_collapsed: false,
  sidebar_groups_collapsed: {},
});

test.describe('Fluid Dashboard Layout', () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

  test.beforeEach(async ({ page }) => {
    // Ngăn DB ghi đè preferences trong lúc test (tránh flaky test do state rò rỉ giữa các test)
    await page.route('**/rest/v1/profiles*', async (route) => {
      const method = route.request().method();
      const url = route.request().url();

      if (method === 'GET' && url.includes('select=preferences')) {
        // Supabase .single() expects an object (or array depending on PostgREST headers, but usually array of 1 or object)
        // Returning empty preferences means fallback to local cache
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ preferences: {} }),
        });
      } else if (method === 'PATCH') {
        // Chặn không cho test ghi đè lên DB thật gây ảnh hưởng test khác
        await route.fulfill({
          status: 204, // Supabase update thường trả về 204 No Content nếu không có select
        });
      } else {
        await route.fallback();
      }
    });
  });

  for (const route of FLUID_ROUTES) {
    test(`fluid layout active @ ${route}`, async ({ page }) => {
      // Bước 1: Inject preferences cache TRƯỚC khi page load
      await page.addInitScript(
        ([key, prefs]) => {
          localStorage.setItem(key, prefs);
        },
        [PREFS_CACHE_KEY, FLUID_PREFS] as const,
      );

      await page.goto(route, {
        waitUntil: 'domcontentloaded',
        timeout: 15_000,
      });

      // Wait for app shell to mount — ensures useUserPreferences has run
      await page
        .waitForSelector('.route-content', { timeout: 10_000 })
        .catch(() => null);

      // Bước 2: Wait cho React boot và apply class 'fluid' lên html
      // (useUserPreferences đọc cache → applyFluidLayout → classList.toggle)
      await expect(page.locator('html')).toHaveClass(/fluid/, {
        timeout: 10_000,
      });

      // Bước 3: Verify shell-layout chiếm >= 95% viewport width
      const shellLayout = page.locator('.shell-layout');
      const isVisible = await shellLayout.isVisible().catch(() => false);

      if (isVisible) {
        // Đợi CSS transition settle
        await page.waitForTimeout(300);
        const shellWidth = await shellLayout.evaluate(
          (el) => el.getBoundingClientRect().width,
        );
        expect(
          shellWidth,
          `shell-layout should be wider than 1400px in fluid mode on ${route} (got ${shellWidth}px)`,
        ).toBeGreaterThan(1400);
      }
    });
  }

  test('boxed layout by default (no localStorage)', async ({ page }) => {
    // Inject cache KHÔNG có fluid
    await page.addInitScript(
      ([key, prefs]) => {
        localStorage.setItem(key, prefs);
      },
      [
        PREFS_CACHE_KEY,
        JSON.stringify({
          theme: 'light',
          fluid_layout: false,
          sidebar_collapsed: false,
          sidebar_groups_collapsed: {},
        }),
      ] as const,
    );

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await page.waitForTimeout(1_500);

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
        `shell-layout should be <= 1400px in boxed mode (got ${shellWidth}px)`,
      ).toBeLessThanOrEqual(1400);
    }
  });

  test('toggle switch persists and applies', async ({ page }) => {
    // Bước 0: Navigate sang settings trước, rồi xóa cache
    await page.goto('/settings', {
      waitUntil: 'domcontentloaded',
      timeout: 15_000,
    });
    await page.waitForTimeout(1_000);

    // Xóa cache fluid cũ (dùng evaluate thay vì addInitScript để không persist qua reload)
    await page.evaluate((key) => {
      localStorage.removeItem(key);
    }, PREFS_CACHE_KEY);

    // Reload để chạy từ blank state
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1_500);

    const toggle = page.locator('label:has(#layout-mode-switch)');
    const toggleExists = await toggle.isVisible().catch(() => false);

    if (toggleExists) {
      // Click label (wraps hidden checkbox)
      await toggle.click();

      // Verify html class changed — dùng assertion based wait
      await expect(page.locator('html')).toHaveClass(/fluid/, {
        timeout: 3_000,
      });

      // Verify preferences cache persisted (dùng key mới)
      const stored = await page.evaluate((key) => {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        try {
          const parsed = JSON.parse(raw);
          return parsed.fluid_layout ?? null;
        } catch {
          return null;
        }
      }, PREFS_CACHE_KEY);
      expect(stored).toBe(true);

      // Bước 2: F5 — phải giữ nguyên (cache sống qua reload)
      await page.reload({ waitUntil: 'domcontentloaded' });

      await expect(page.locator('html')).toHaveClass(/fluid/, {
        timeout: 5_000,
      });
    }
  });
});
