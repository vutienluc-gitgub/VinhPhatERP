import { test, expect } from '@playwright/test';

test.describe('Visual Regression - Zero-Tolerance Architecture', () => {
  test('Dashboard / Kanban Board (Light & Dark Mode)', async ({ page }) => {
    // 1. Navigate to dashboard
    await page.goto('/');

    // Wait for the page to be fully loaded (adjust selector if needed, e.g., kanban board container)
    // Here we wait for network idle to ensure everything is rendered
    await page.waitForLoadState('networkidle');

    // Hide dynamic elements like timestamps, tooltips or avatars if they cause flakiness.
    // For now, we snapshot the whole page.

    // Light Mode Snapshot
    await expect(page).toHaveScreenshot('dashboard-light-mode.png', {
      fullPage: true,
    });

    // 2. Switch to Dark Mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      // Sometimes there's also a class or local storage, but data-theme is what our CSS targets
    });

    // Wait a brief moment for CSS transitions if any
    await page.waitForTimeout(500);

    // Dark Mode Snapshot
    await expect(page).toHaveScreenshot('dashboard-dark-mode.png', {
      fullPage: true,
    });
  });
});
