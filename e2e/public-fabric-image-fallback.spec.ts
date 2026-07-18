import { test, expect } from '@playwright/test';

test.describe('Public Fabric Detail Page - Image Fallback', () => {
  test('should render No Image placeholder when hero image returns 404', async ({
    page,
  }) => {
    const BROKEN_IMAGE_URL = 'https://fake-cdn.com/broken-image.jpg';

    // 1. Mock API để trả về URL ảnh bị hỏng (để test onError)
    await page.route(
      '**/rest/v1/rpc/rpc_get_public_fabric_basic*',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'mock-123',
            slug: 'mock-fabric-002',
            code: 'FC-002',
            name: 'Vải thun xước',
            image_url: BROKEN_IMAGE_URL,
            status: 'active',
            is_public: true,
            fabric_type: 'knitted',
            unit: 'kg',
          }),
        });
      },
    );

    // 2. Intercept request tải ảnh và chủ động báo lỗi 404
    await page.route(BROKEN_IMAGE_URL, async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'text/plain',
        body: 'Not found',
      });
    });

    // 3. Truy cập trang chi tiết vải
    await page.goto('/p/fabric/mock-fabric-002', { waitUntil: 'networkidle' });

    // 4. Kiểm tra sự xuất hiện của giao diện Fallback (No Image)
    // Sau khi img kích hoạt onError, React sẽ đổi state và render ra fallback div
    const fallbackContainer = page.locator('.aspect-\\[4\\/3\\]');

    // Đảm bảo icon ImageOff (lucide-image-off) hiển thị
    const fallbackIcon = fallbackContainer.locator('.lucide-image-off');
    await expect(fallbackIcon).toBeVisible({ timeout: 5000 });

    // Đảm bảo text "Chưa có ảnh" (GLOBAL_LABELS.PREVIEW_NO_IMAGE) hiển thị
    const fallbackText = fallbackContainer.locator('text="Chưa có ảnh"');
    await expect(fallbackText).toBeVisible();

    // 5. Đảm bảo thẻ img gốc có src bị hỏng đã bị xoá khỏi DOM hoặc ẩn đi
    const brokenImg = fallbackContainer.locator('img');
    await expect(brokenImg).toBeHidden();
  });
});
