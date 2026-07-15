import { test } from '@playwright/test';

test('Icon debug', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', (msg) => logs.push(msg.text()));
  page.on('pageerror', (err) => logs.push(`PAGE ERROR: ${err.message}`));

  await page.goto('/production/finished-fabric');
  await page.waitForTimeout(3000);

  console.log(
    'BROWSER LOGS:',
    logs.filter((l) => l.includes('[Icon Debug]') || l.includes('ERROR')),
  );
});
