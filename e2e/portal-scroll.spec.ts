import { test, expect, type Page } from '@playwright/test';

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
 *
 * Spec này tự dựng session giả trong localStorage (`vinhphat_session`) nên
 * không cần E2E_EMAIL/E2E_PASSWORD — chỉ mock `profiles` + `orders`.
 */

const MOBILE_VIEWPORT = { width: 375, height: 667 };
const STORAGE_KEY = 'vinhphat_session';

test.use({ viewport: MOBILE_VIEWPORT, hasTouch: true });

function buildFakeSession() {
  return {
    access_token: 'fake-access-token',
    refresh_token: 'fake-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: {
      id: 'portal-customer-001',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'customer.e2e@vinhphat.local',
      app_metadata: {},
      user_metadata: { full_name: 'Khách E2E' },
    },
  };
}

async function primeCustomerSession(page: Page) {
  // Session giả — supabase-js đọc từ localStorage, không verify chữ ký ở client.
  await page.addInitScript(
    ([key, session]) => {
      window.localStorage.setItem(key, session);
    },
    [STORAGE_KEY, JSON.stringify(buildFakeSession())] as const,
  );

  await page.route('**/rest/v1/profiles*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'portal-customer-001',
        full_name: 'Khách E2E',
        role: 'customer',
        roles: ['customer'],
        customer_id: 'customer-e2e-01',
        is_active: true,
      }),
    });
  });

  // Danh sách đơn rỗng vẫn render được trang (không phụ thuộc dữ liệu thật).
  await page.route('**/rest/v1/orders*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}

async function realTouchSwipeUp(page: Page, distance = 320) {
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setTouchEmulationEnabled', {
    enabled: true,
    maxTouchPoints: 1,
  });

  const x = Math.round(MOBILE_VIEWPORT.width / 2);
  const startY = MOBILE_VIEWPORT.height - 120;

  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y: startY }],
  });
  for (let y = startY; y >= startY - distance; y -= 40) {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y }],
    });
    await page.waitForTimeout(16);
  }
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await client.detach();
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

    // 1. Contract class phải có mặt (R8).
    await expect(shell).toHaveClass(/app-scroll-root/);

    // 2. Ép nội dung dài hơn viewport để chắc chắn phải sinh thanh cuộn.
    await shell.evaluate((el) => {
      const spacer = document.createElement('div');
      spacer.style.height = '3000px';
      spacer.style.minHeight = '3000px';
      spacer.style.flexShrink = '0';
      el.appendChild(spacer);
    });

    const isScrollable = await shell.evaluate(
      (el) => el.scrollHeight > el.clientHeight,
    );
    expect(
      isScrollable,
      'portal-shell phải cuộn được (scrollHeight > clientHeight)',
    ).toBe(true);

    // 3. Vuốt thật bằng touch event → scrollTop phải tăng.
    const before = await shell.evaluate((el) => el.scrollTop);
    await realTouchSwipeUp(page);
    await page.waitForTimeout(150);
    const after = await shell.evaluate((el) => el.scrollTop);

    expect(
      after,
      `Vuốt lên phải cuộn được (scrollTop ${before} → ${after})`,
    ).toBeGreaterThan(before);
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
