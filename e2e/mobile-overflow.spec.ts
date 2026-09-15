import { test, expect, type Page } from '@playwright/test';

/**
 * Horizontal-overflow regression test.
 *
 * Principle: Trên mobile viewport (iPhone SE 375x667), body/document
 * KHÔNG được phép có scrollWidth lớn hơn clientWidth. Nếu có nghĩa là
 * có phần tử nào đó tràn ngang → vi phạm responsive-rules.md R1.
 *
 * Spec này chạy trong project `chromium-authed` (xem playwright.config.ts)
 * với storageState đã login từ globalSetup. Nếu E2E_EMAIL/E2E_PASSWORD
 * chưa set, mọi route sẽ redirect về /auth và test chỉ xác nhận trang
 * login không bị overflow — vẫn hữu ích nhưng không đi sâu.
 *
 * Cách chạy:
 *   $env:E2E_EMAIL="..."; $env:E2E_PASSWORD="..."; npm run test:e2e
 *   npx playwright test e2e/mobile-overflow.spec.ts --ui
 */

const MOBILE_VIEWPORT = { width: 375, height: 667 };

/** Các route cần kiểm tra. Thêm vào khi có plugin/route mới. */
const ROUTES_TO_CHECK = [
  '/',
  '/orders',
  '/order-kanban',
  '/order-progress',
  '/customers',
  '/suppliers',
  '/fabric-catalog',
  '/finished-fabric',
  '/yarn-catalog',
  '/color-catalog',
  '/raw-fabric',
  '/work-orders',
  '/dyeing-orders',
  '/weaving-invoices',
  '/yarn-receipts',
  '/quotations',
  '/contracts',
  '/contract-templates',
  '/shipments',
  '/shipping-rates',
  '/payments',
  '/debts',
  '/reports',
  '/employees',
  '/inventory',
  '/operations',
  '/bom',
  '/settings',
];

async function assertNoHorizontalOverflow(page: Page, route: string) {
  // ⏳ Chờ layout ổn định trước khi đo — chống flaky khi full-suite chạy song
  // song (2 workers) làm render chậm: font swap, lazy chunk, data async.
  // Vẫn đo ngay sau khi ổn định → overflow THẬT (persistent) vẫn bị bắt.
  await page.evaluate(async () => {
    await document.fonts.ready;

    const maxMs = 5_000;
    const start = performance.now();
    let prevWidth = -1;
    let stableFrames = 0;

    while (performance.now() - start < maxMs) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      const width = document.documentElement.scrollWidth;
      stableFrames = width === prevWidth ? stableFrames + 1 : 0;
      prevWidth = width;
      if (stableFrames >= 3) return; // scrollWidth không đổi qua 3 frame liên tiếp
    }
  });

  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    // Tìm phần tử cụ thể gây overflow để debug
    const culprits: Array<{ tag: string; cls: string; w: number }> = [];
    document.querySelectorAll('*').forEach((el) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      if (rect.right > window.innerWidth + 1) {
        culprits.push({
          tag: el.tagName.toLowerCase(),
          cls: (el as HTMLElement).className?.toString().slice(0, 120) ?? '',
          w: Math.round(rect.right - window.innerWidth),
        });
      }
    });
    return {
      docScrollW: doc.scrollWidth,
      docClientW: doc.clientWidth,
      bodyScrollW: body.scrollWidth,
      bodyClientW: body.clientWidth,
      innerW: window.innerWidth,
      // lấy tối đa 5 culprit để log gọn
      culprits: culprits.slice(0, 5),
    };
  });

  if (metrics.docScrollW > metrics.docClientW) {
    console.error(`[OVERFLOW] ${route}`, JSON.stringify(metrics, null, 2));
  }
  expect(
    metrics.docScrollW,
    `Horizontal overflow on ${route}. Culprits: ${JSON.stringify(metrics.culprits)}`,
  ).toBeLessThanOrEqual(metrics.docClientW);
}

test.describe('Mobile horizontal overflow audit (375px)', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  for (const route of ROUTES_TO_CHECK) {
    test(`no overflow @ ${route}`, async ({ page }) => {
      // `domcontentloaded` thay vì `networkidle` — tránh timeout do Supabase
      // realtime/polling. Overflow có thể đo ngay khi DOM đã render xong.
      await page.goto(route, {
        waitUntil: 'domcontentloaded',
        timeout: 15_000,
      });
      // Đợi layout ổn định (font swap, lazy chunk, React commit)
      await page.waitForTimeout(600);
      await assertNoHorizontalOverflow(page, route);
    });
  }
});
