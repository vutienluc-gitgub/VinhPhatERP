import { test, expect, type Page } from '@playwright/test';

import {
  MOBILE_VIEWPORT,
  buildFakeSupabaseSession,
  expectScrollOwnerScrolls,
  installFakeSession,
  mockJsonRoute,
} from './helpers/scroll-helpers';

/**
 * Portal vertical-scroll regression.
 *
 * Bối cảnh: trên mobile (<768px), `html/body` bị `overflow: hidden` trong
 * `src/styles/layout/app-shell.css` để chặn pull-to-refresh & rubber-band của
 * iOS Safari. Vì vậy mọi layout top-level NGOÀI `.shell-layout` (ví dụ
 * `.portal-shell`) phải tự khai báo scroll owner qua class `.app-scroll-root`
 * (xem `src/styles/layout/scroll-root.css` + R8 trong docs/responsive-rules.md).
 *
 * Nếu thiếu, nội dung dài bị cắt cụt và người dùng KHÔNG vuốt được.
 */

test.use({ viewport: MOBILE_VIEWPORT, hasTouch: true });

async function primeCustomerSession(page: Page) {
  await installFakeSession(
    page,
    buildFakeSupabaseSession(
      'portal-customer-001',
      'customer.e2e@vinhphat.local',
      'Khách E2E',
    ),
  );

  await mockJsonRoute(page, '**/rest/v1/profiles*', {
    id: 'portal-customer-001',
    full_name: 'Khách E2E',
    role: 'customer',
    roles: ['customer'],
    customer_id: 'customer-e2e-01',
    is_active: true,
  });

  // Danh sách đơn rỗng vẫn render được trang (không phụ thuộc dữ liệu thật).
  await mockJsonRoute(page, '**/rest/v1/orders*', []);
}

test.describe('Customer Portal — vertical scroll on mobile', () => {
  test('portal-shell is a scroll owner and responds to touch swipe', async ({
    page,
  }) => {
    await primeCustomerSession(page);

    await page.goto('/portal/customer/orders', {
      waitUntil: 'domcontentloaded',
      timeout: 20_000,
    });

    const shell = page.locator('.portal-shell').first();
    await expect(shell).toBeVisible({ timeout: 15_000 });

    await expectScrollOwnerScrolls(page, shell);
  });

  test('no horizontal overflow on portal-shell', async ({ page }) => {
    await primeCustomerSession(page);
    await page.goto('/portal/customer/orders', {
      waitUntil: 'domcontentloaded',
      timeout: 20_000,
    });
    await expect(page.locator('.portal-shell').first()).toBeVisible({
      timeout: 15_000,
    });
    await page.waitForTimeout(400);

    const { docScrollW, docClientW } = await page.evaluate(() => ({
      docScrollW: document.documentElement.scrollWidth,
      docClientW: document.documentElement.clientWidth,
    }));

    expect(docScrollW).toBeLessThanOrEqual(docClientW);
  });
});
