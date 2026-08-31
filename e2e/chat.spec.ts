import { test, expect } from '@playwright/test';

const TEST_ROOM_ID = 'dd46feb3-3afa-45cc-a4f6-7420c583a90b';

test.describe('Chat Enterprise System (E2E Authed)', () => {
  test('1. Opens Chat Drawer via URL deep link and verifies structure', async ({
    page,
  }) => {
    // Navigate with deep-link query params (simulates click on Lock Screen notification)
    await page.goto(`/?chatOpen=1&roomId=${TEST_ROOM_ID}`, {
      waitUntil: 'domcontentloaded',
      timeout: 20_000,
    });

    // 1. Chat Drawer must be visible
    const chatDrawer = page.locator('.chat-drawer');
    await expect(chatDrawer).toBeVisible({ timeout: 15_000 });

    // 2. Chat Header must render title and actions
    const chatHeader = page.locator('.chat-header-v3');
    await expect(chatHeader).toBeVisible();

    const closeBtn = page.locator('.chat-header-close-btn');
    await expect(closeBtn).toBeVisible();

    // 3. Message timeline viewport
    const viewport = page.locator('.chat-body-viewport');
    await expect(viewport).toBeVisible({ timeout: 15_000 });

    // 4. Composer input area
    const inputArea = page.locator('.chat-composer');
    await expect(inputArea).toBeVisible();

    const textarea = page.locator('.chat-input-field');
    await expect(textarea).toBeVisible();

    // 5. Close drawer
    await closeBtn.click();
    await expect(chatDrawer).not.toBeVisible({ timeout: 5_000 });
  });

  test('2. Opens Chat Inbox from TopBar and verifies conversations panel', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await page.waitForSelector('main', { timeout: 15_000 }).catch(() => null);

    const chatInboxBtn = page
      .locator('button[aria-label="Tin nhắn"], button[title*="Tin nhắn"]')
      .first();

    if (await chatInboxBtn.isVisible({ timeout: 5_000 })) {
      await chatInboxBtn.click();

      const inboxPanel = page.locator('.chat-inbox-panel');
      await expect(inboxPanel).toBeVisible({ timeout: 10_000 });

      // Close inbox panel
      const closeBtn = inboxPanel.locator('button').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
  });

  test('3. Verifies composer input reactivity and send button states', async ({
    page,
  }) => {
    await page.goto(`/?chatOpen=1&roomId=${TEST_ROOM_ID}`, {
      waitUntil: 'domcontentloaded',
      timeout: 20_000,
    });

    const chatDrawer = page.locator('.chat-drawer');
    await expect(chatDrawer).toBeVisible({ timeout: 15_000 });

    const textarea = page.locator('.chat-input-field');
    await expect(textarea).toBeVisible();

    // Initial state: Utility plus button is visible, Send button is hidden
    const plusBtn = page.locator(
      'button[title*="tiện ích"], button[aria-label*="tiện ích"], .chat-composer-btn',
    );
    await expect(plusBtn.first()).toBeVisible();

    // Type text into composer
    await textarea.fill('Xin chao Vinh Phat');

    // Send button should now appear
    const sendBtn = page.locator('.chat-send-btn');
    await expect(sendBtn).toBeVisible({ timeout: 5_000 });
    await expect(sendBtn).toBeEnabled();

    // Clear text
    await textarea.fill('');

    // Close drawer
    const closeBtn = page.locator('.chat-header-close-btn');
    await closeBtn.click();
    await expect(chatDrawer).not.toBeVisible({ timeout: 5_000 });
  });
});
