import { test, expect, type Page } from '@playwright/test';

import {
  MOBILE_VIEWPORT,
  buildFakeSupabaseSession,
  expectScrollOwnerScrolls,
  installFakeSession,
  mockJsonRoute,
} from './helpers/scroll-helpers';

/**
 * Driver Portal vertical-scroll regression.
 *
 * Cùng contract với `portal-scroll.spec.ts` (R8 trong docs/responsive-rules.md):
 * `.driver-portal-shell` là layout top-level NGOÀI `.shell-layout`, nên trên
 * mobile phải tự khai báo scroll owner qua `.app-scroll-root`.
 */

test.use({ viewport: MOBILE_VIEWPORT, hasTouch: true });

async function primeDriverSession(page: Page) {
  await installFakeSession(
    page,
    buildFakeSupabaseSession(
      'driver-profile-001',
      'driver.e2e@vinhphat.local',
      'Tài xế E2E',
    ),
  );

  await mockJsonRoute(page, '**/rest/v1/profiles*', {
    id: 'driver-profile-001',
    full_name: 'Tài xế E2E',
    role: 'driver',
    roles: ['driver'],
    employee_id: 'employee-driver-01',
    is_active: true,
  });

  await mockJsonRoute(page, '**/rest/v1/employees*', {
    id: 'employee-driver-01',
    name: 'Tài xế E2E',
    code: 'TX001',
    role: 'driver',
  });

  // Nhiều shipment để nội dung chắc chắn dài hơn viewport.
  await mockJsonRoute(
    page,
    '**/rest/v1/shipments*',
    Array.from({ length: 30 }, (_, i) => ({
      id: `shipment-${i}`,
      shipment_number: `PX-2026-${String(i).padStart(4, '0')}`,
      shipment_date: '2026-01-01',
      status: 'shipped',
      journey_status: 'pending',
      delivery_address: 'KCN Tân Bình, TP.HCM',
      vehicle_info: '51C-12345',
      shipping_cost: 0,
      loading_fee: 0,
      customers: { name: 'Khách E2E', address: 'TP.HCM', phone: '0900000000' },
      orders: { order_number: `DH-${i}` },
    })),
  );
}

test.describe('Driver Portal — vertical scroll on mobile', () => {
  test('driver-portal-shell is a scroll owner and responds to touch swipe', async ({
    page,
  }) => {
    await primeDriverSession(page);

    await page.goto('/driver', {
      waitUntil: 'domcontentloaded',
      timeout: 20_000,
    });

    const shell = page.locator('.driver-portal-shell').first();
    await expect(shell).toBeVisible({ timeout: 15_000 });

    await expectScrollOwnerScrolls(page, shell);
  });
});
