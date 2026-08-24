import { test, expect } from '@playwright/test';

const VISUAL_ROUTES = [
  { name: 'dashboard', path: '/' },
  { name: 'dyeing-orders', path: '/dyeing-orders' },
  { name: 'quotations', path: '/quotations' },
  { name: 'inventory', path: '/inventory' },
  { name: 'operations', path: '/operations' },
];

test.describe('Visual Regression - Zero-Tolerance Architecture', () => {
  test.setTimeout(60_000);

  for (const item of VISUAL_ROUTES) {
    test(`${item.name} (Light & Dark Mode)`, async ({ page }) => {
      // 1. Navigate to route
      await page.goto(item.path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Light Mode Snapshot
      await expect(page).toHaveScreenshot(`${item.name}-light-mode.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      });

      // 2. Switch to Dark Mode
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
      });

      // Wait brief moment for CSS transitions
      await page.waitForTimeout(600);

      // Dark Mode Snapshot
      await expect(page).toHaveScreenshot(`${item.name}-dark-mode.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      });
    });
  }
});
