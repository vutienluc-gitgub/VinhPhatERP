import { test, expect } from '@playwright/test';

test.describe('Public Fabric Detail Page - Scroll Regression', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // Mobile viewport

  test('should have a vertically scrollable container that bypasses body scroll lock', async ({
    page,
  }) => {
    // 1. Mock API để trang render giao diện chi tiết (thoát khỏi màn hình Error skeleton)
    await page.route(
      '**/rest/v1/rpc/rpc_get_public_fabric_basic*',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'mock-id',
            code: 'MOCK-001',
            name: 'Vải Mock E2E',
            slug: 'mock-001',
            fabric_type: 'knitted',
            composition: '100% Cotton',
            target_width_cm: 200,
            target_gsm: 250,
          }),
        });
      },
    );

    // Mock thêm API variants để render khối color selector
    await page.route('**/rest/v1/fabric_variants?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/p/fabric/mock-001', { waitUntil: 'domcontentloaded' });

    // 2. Tìm container cuộn chính của trang
    const scrollContainer = page
      .locator('div.h-screen.min-h-\\[100dvh\\].overflow-y-auto')
      .first();
    await expect(scrollContainer).toBeVisible({ timeout: 10_000 });

    // 3. Đảm bảo nó có đầy đủ các class chống lock scroll
    await expect(scrollContainer).toHaveClass(/h-screen/);
    await expect(scrollContainer).toHaveClass(/min-h-\[100dvh\]/);
    await expect(scrollContainer).toHaveClass(/overflow-y-auto/);
    await expect(scrollContainer).toHaveClass(/overflow-x-hidden/);

    // 4. Bơm thêm DOM giả lập nội dung rất dài để chắc chắn container phải sinh ra thanh cuộn
    const isScrollable = await scrollContainer.evaluate((el) => {
      const spacer = document.createElement('div');
      spacer.style.height = '2000px'; // Ép chiều cao dài hơn viewport
      spacer.style.minHeight = '2000px';
      spacer.style.flexShrink = '0';
      el.appendChild(spacer);

      // Kiểm tra xem container có thực sự sinh ra thanh cuộn dọc không
      return el.scrollHeight > el.clientHeight;
    });

    expect(isScrollable).toBe(
      true,
      'Container phải có khả năng cuộn dọc (scrollHeight > clientHeight)',
    );

    // 5. Thực hiện cuộn thử và xác nhận scrollTop có thay đổi
    await scrollContainer.evaluate((el) => el.scrollBy(0, 500));

    // Đợi một chút cho event scroll kịp phản hồi
    await page.waitForTimeout(100);

    const scrollTop = await scrollContainer.evaluate((el) => el.scrollTop);
    expect(scrollTop).toBeGreaterThan(0);
  });
});
