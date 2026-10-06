import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Shared helpers cho e2e scroll-owner contract (R8 — docs/responsive-rules.md).
 *
 * Dùng chung cho các portal layout top-level ngoài `.shell-layout`
 * (customer/supplier portal, driver portal, public pages).
 */

export const MOBILE_VIEWPORT = { width: 375, height: 667 };

/** Trùng với `storageKey` trong src/services/supabase/client.ts */
export const E2E_STORAGE_KEY = 'vinhphat_session';

export function buildFakeSupabaseSession(
  userId: string,
  email: string,
  fullName: string,
) {
  return {
    access_token: 'fake-access-token',
    refresh_token: 'fake-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: {
      id: userId,
      aud: 'authenticated',
      role: 'authenticated',
      email,
      app_metadata: {},
      user_metadata: { full_name: fullName },
    },
  };
}

/**
 * Nạp session giả vào localStorage trước khi app khởi động.
 * supabase-js chỉ đọc storage, không verify chữ ký ở client → đủ để qua
 * AuthProvider mà không cần E2E_EMAIL/E2E_PASSWORD.
 */
export async function installFakeSession(page: Page, session: unknown) {
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [E2E_STORAGE_KEY, JSON.stringify(session)] as const,
  );
}

export async function mockJsonRoute(
  page: Page,
  urlPattern: string,
  body: unknown,
) {
  await page.route(urlPattern, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

/** Vuốt lên bằng touch event thật qua CDP (không dùng mouse.wheel). */
export async function realTouchSwipeUp(
  page: Page,
  viewport: { width: number; height: number } = MOBILE_VIEWPORT,
  distance = 320,
) {
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setTouchEmulationEnabled', {
    enabled: true,
    maxTouchPoints: 1,
  });

  const x = Math.round(viewport.width / 2);
  const startY = viewport.height - 120;

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

/**
 * Assert đầy đủ hợp đồng scroll owner:
 *  1. có class `.app-scroll-root`
 *  2. nội dung dài → scrollHeight > clientHeight
 *  3. vuốt touch thật → scrollTop tăng
 */
export async function expectScrollOwnerScrolls(page: Page, shell: Locator) {
  await expect(shell).toHaveClass(/app-scroll-root/);

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
    'scroll owner phải cuộn được (scrollHeight > clientHeight)',
  ).toBe(true);

  const before = await shell.evaluate((el) => el.scrollTop);
  await realTouchSwipeUp(page);
  await page.waitForTimeout(150);
  const after = await shell.evaluate((el) => el.scrollTop);

  expect(
    after,
    `Vuốt lên phải cuộn được (scrollTop ${before} → ${after})`,
  ).toBeGreaterThan(before);
}
