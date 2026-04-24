import { test, expect, type ConsoleMessage, type Page } from '@playwright/test';

const MOBILE_VIEWPORT = { width: 375, height: 667 };

const CORE_ROUTES = [
  '/',
  '/orders',
  '/operations',
  '/customers',
  '/payments',
  '/reports',
  '/settings',
];

function isSevereConsoleError(message: ConsoleMessage): boolean {
  if (message.type() !== 'error') {
    return false;
  }

  const text = message.text().toLowerCase();
  return (
    text.includes('typeerror') ||
    text.includes('referenceerror') ||
    text.includes('unhandled') ||
    text.includes('failed to fetch') ||
    text.includes('cannot read')
  );
}

async function collectRuntimeIssues(page: Page, route: string): Promise<void> {
  const pageErrors: string[] = [];
  const severeConsoleErrors: string[] = [];

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  page.on('console', (message) => {
    if (isSevereConsoleError(message)) {
      severeConsoleErrors.push(message.text());
    }
  });

  await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 15_000 });
  await page.waitForTimeout(600);

  await expect(
    page,
    `Route ${route} redirected to /auth. Check E2E credentials and seeded storageState.`,
  ).not.toHaveURL(/\/auth(?:$|\?)/);

  await expect(page.locator('main')).toBeVisible();

  const firstInteractiveControl = page
    .locator(
      'main button, main input, main select, main textarea, main [role="button"]',
    )
    .first();
  await expect(
    firstInteractiveControl,
    `No interactive control found on ${route}.`,
  ).toBeVisible();

  expect(
    pageErrors,
    `Runtime page errors on ${route}: ${JSON.stringify(pageErrors)}`,
  ).toHaveLength(0);

  expect(
    severeConsoleErrors,
    `Severe console errors on ${route}: ${JSON.stringify(severeConsoleErrors)}`,
  ).toHaveLength(0);
}

test.describe('Core mobile smoke (authed)', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  for (const route of CORE_ROUTES) {
    test(`smoke @ ${route}`, async ({ page }) => {
      await collectRuntimeIssues(page, route);
    });
  }
});
