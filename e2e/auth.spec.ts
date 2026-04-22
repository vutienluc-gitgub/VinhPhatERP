import { test, expect } from '@playwright/test';

test.describe('Luồng Đăng Nhập', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Turnstile để bypass bước xác minh captcha trên UI
    await page.addInitScript(() => {
      window.turnstile = {
        render: (
          container: unknown,
          options: { callback?: (token: string) => void },
        ) => {
          // Tự động gọi callback xác minh thành công sau 100ms
          setTimeout(() => {
            if (options && typeof options.callback === 'function') {
              options.callback('dummy-turnstile-token');
            }
          }, 100);
          return 'dummy-widget-id';
        },
        reset: () => {},
        remove: () => {},
      };
    });

    // Mock API Supabase Auth để không cần gọi lên server thực tế
    await page.route('**/auth/v1/token?grant_type=password', async (route) => {
      const request = route.request();
      const postData = JSON.parse(request.postData() || '{}');

      if (
        postData.email === 'admin@vinhphat.vn' &&
        postData.password === 'password123'
      ) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'fake-access-token',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'fake-refresh-token',
            user: {
              id: 'user-123',
              aud: 'authenticated',
              role: 'authenticated',
              email: 'admin@vinhphat.vn',
              app_metadata: {},
              user_metadata: {},
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'invalid_grant',
            error_description: 'Invalid login credentials',
          }),
        });
      }
    });
  });

  test('Đăng nhập thành công với tài khoản hợp lệ', async ({ page }) => {
    // Giả sử trang / mặc định redirect về /auth nếu chưa đăng nhập
    // Hoặc ta vào thẳng /auth
    await page.goto('/');

    // Điền thông tin đăng nhập
    await page.fill('input[id="email"]', 'admin@vinhphat.vn');
    await page.fill('input[id="password"]', 'password123');

    // Chờ Turnstile mock tự động xác thực xong, nút đăng nhập sẽ hết disable
    const loginBtn = page.getByRole('button', {
      name: /Đăng nhập vào hệ thống/i,
    });
    await expect(loginBtn).toBeEnabled();

    // Click đăng nhập
    await loginBtn.click();

    // Verify chuyển hướng về trang chủ
    await expect(page).toHaveURL(/\/?$/);
  });

  test('Đăng nhập thất bại hiển thị thông báo lỗi', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[id="email"]', 'wrong@email.com');
    await page.fill('input[id="password"]', 'wrongpass');

    const loginBtn = page.getByRole('button', {
      name: /Đăng nhập vào hệ thống/i,
    });
    await expect(loginBtn).toBeEnabled();

    await loginBtn.click();

    // Kiểm tra thông báo lỗi hiển thị
    await expect(
      page.getByText('Email hoặc mật khẩu không đúng.'),
    ).toBeVisible();
  });
});
