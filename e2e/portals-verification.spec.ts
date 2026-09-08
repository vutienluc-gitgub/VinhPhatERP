import path from 'path';

import { test } from '@playwright/test';

const ARTIFACT_DIR =
  'C:/Users/Admin/.gemini/antigravity-ide/brain/232f1250-e209-47b5-8741-d05d392efa61';

test.describe('E2E Portals Verification — Driver & Supplier Portals', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    // Mock Turnstile
    await page.addInitScript(() => {
      window.turnstile = {
        render: (
          _container: unknown,
          options: { callback?: (token: string) => void },
        ) => {
          setTimeout(() => {
            if (options && typeof options.callback === 'function') {
              options.callback('dummy-turnstile-token');
            }
          }, 50);
          return 'dummy-widget-id';
        },
        reset: () => {},
        remove: () => {},
      };
    });

    // Mock Auth Token
    await page.route('**/auth/v1/token?grant_type=password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'fake-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'fake-refresh-token',
          user: {
            id: 'portal-user-123',
            aud: 'authenticated',
            role: 'authenticated',
            email: '1081991@gmail.com',
            app_metadata: {},
            user_metadata: { full_name: 'Vũ Tiến Lực' },
          },
        }),
      });
    });
  });

  test('Verify Driver Portal UI and capture screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // Mobile portrait

    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'portal-user-123',
          email: '1081991@gmail.com',
          full_name: 'Vũ Tiến Lực',
          role: 'driver',
          roles: ['driver'],
          is_active: true,
        }),
      });
    });

    await page.route('**/rest/v1/employees*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'emp-driver-01', full_name: 'Vũ Tiến Lực' },
        ]),
      });
    });

    await page.route('**/rest/v1/shipments*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'ship-001',
            shipment_number: 'DH-2026-0907-01',
            shipment_date: '2026-09-07',
            shipping_cost: 250000,
            loading_fee: 50000,
            delivery_address: '120 Nguyễn Tất Thành, Quận 4, TP.HCM',
            vehicle_info: 'Xe tải 2.5T - 51C-889.99',
            journey_status: 'in_transit',
            status: 'in_transit',
            customers: {
              name: 'Công ty TNHH Dệt May Thắng Lợi',
              phone: '0903123456',
            },
          },
        ]),
      });
    });

    await page.goto('/auth');
    await page.fill('input[id="email"]', '1081991@gmail.com');
    await page.fill('input[id="password"]', 'Vinhphat@2026');

    const loginBtn = page.getByRole('button', { name: /Đăng nhập/i });
    if (await loginBtn.isVisible()) {
      await loginBtn.click();
    }

    await page.goto('/driver');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'driver_portal_verified.png'),
      fullPage: true,
    });
  });

  test('Verify Supplier Portal UI and capture screenshots', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'portal-user-123',
          email: '1081991@gmail.com',
          full_name: 'Vũ Tiến Lực',
          role: 'supplier',
          roles: ['supplier'],
          supplier_id: 'supp-demo-01',
          is_active: true,
        }),
      });
    });

    await page.route('**/rest/v1/suppliers*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'supp-demo-01',
          name: 'Công ty Sợi Dệt Nam Định',
          category: 'yarn',
          status: 'active',
        }),
      });
    });

    await page.route('**/rest/v1/v_supplier_debt*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          balance_due: 45000000,
          total_purchased: 150000000,
          total_paid: 105000000,
        }),
      });
    });

    await page.route('**/rest/v1/purchase_orders*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'po-01',
            po_code: 'PO-2026-001',
            order_date: '2026-09-05',
            total_amount: 35000000,
            status: 'sent',
          },
        ]),
      });
    });

    await page.route('**/rest/v1/sourcing_rfqs*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'rfq-01',
            rfq_code: 'RFQ-2026-088',
            title: 'Cung cấp sợi Polyester 150D/48F tháng 9',
            deadline_date: '2026-09-15',
            status: 'published',
          },
        ]),
      });
    });

    await page.route(
      '**/rest/v1/supplier_debt_transactions*',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'tx-01',
              type: 'purchase',
              amount: 35000000,
              balance_after: 45000000,
              created_at: '2026-09-05T08:00:00.000Z',
              notes: 'Nhập sợi đợt 1',
            },
            {
              id: 'tx-02',
              type: 'payment',
              amount: 20000000,
              balance_after: 10000000,
              created_at: '2026-09-06T14:30:00.000Z',
              notes: 'Thanh toán đợt 1 qua VCB',
            },
          ]),
        });
      },
    );

    await page.route('**/rest/v1/v_unpaid_documents*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'doc-01',
            document_number: 'HD-2026-009',
            document_type: 'Hóa đơn GTGT',
            document_date: '2026-09-05',
            total_amount: 35000000,
            remaining_amount: 15000000,
          },
        ]),
      });
    });

    await page.goto('/auth');
    await page.fill('input[id="email"]', '1081991@gmail.com');
    await page.fill('input[id="password"]', 'Vinhphat@2026');

    const loginBtn = page.getByRole('button', { name: /Đăng nhập/i });
    if (await loginBtn.isVisible()) {
      await loginBtn.click();
    }

    // 1. Supplier Dashboard
    await page.goto('/portal/supplier');
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'supplier_portal_dashboard_verified.png'),
      fullPage: true,
    });

    // 2. Supplier PO Orders
    await page.goto('/portal/supplier/orders');
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'supplier_portal_orders_verified.png'),
      fullPage: true,
    });

    // 3. Supplier Debt
    await page.goto('/portal/supplier/debt');
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'supplier_portal_debt_verified.png'),
      fullPage: true,
    });

    // 4. Supplier Invoices
    await page.goto('/portal/supplier/invoices');
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'supplier_portal_invoices_verified.png'),
      fullPage: true,
    });
  });
});
