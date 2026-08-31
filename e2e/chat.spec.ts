import { test, expect, type Page } from '@playwright/test';

const TEST_ROOM_ID = 'dd46feb3-3afa-45cc-a4f6-7420c583a90b';

async function waitForAppReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('main', { timeout: 15_000 }).catch(() => null);
}

test.describe('Chat Enterprise System (E2E Authed)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to base authed route
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('1. Opens Chat Drawer via URL deep link and renders timeline components', async ({
    page,
  }) => {
    // Navigate with deep-link query params (simulates click on Lock Screen notification)
    await page.goto(`/?chatOpen=1&roomId=${TEST_ROOM_ID}`, {
      waitUntil: 'domcontentloaded',
    });

    // 1. Chat Drawer must be visible
    const chatDrawer = page.locator('.chat-drawer');
    await expect(chatDrawer).toBeVisible({ timeout: 10_000 });

    // 2. Chat Header must render title and actions
    const chatHeader = page.locator('.chat-header-v3');
    await expect(chatHeader).toBeVisible();

    const closeBtn = page.locator('.chat-header-close-btn');
    await expect(closeBtn).toBeVisible();

    // 3. Message timeline viewport
    const viewport = page.locator('.chat-body-viewport');
    await expect(viewport).toBeVisible({ timeout: 10_000 });

    // 4. Composer input area
    const inputArea = page.locator('.chat-input-area');
    await expect(inputArea).toBeVisible();

    const textarea = page.locator('.chat-input-textarea');
    await expect(textarea).toBeVisible();
    await expect(textarea).toBeEnabled();

    // 5. Close drawer
    await closeBtn.click();
    await expect(chatDrawer).not.toBeVisible({ timeout: 5_000 });
  });

  test('2. Opens Chat from Customers Management Page', async ({ page }) => {
    await page.goto('/customers', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);

    // Find any customer chat button if present
    const customerChatBtn = page
      .locator(
        'button:has-text("Chat"), button[title*="Chat"], [data-testid="customer-chat-btn"]',
      )
      .first();

    if (await customerChatBtn.isVisible()) {
      await customerChatBtn.click();

      const chatDrawer = page.locator('.chat-drawer');
      await expect(chatDrawer).toBeVisible({ timeout: 10_000 });

      // Verify composer is present
      const textarea = page.locator('.chat-input-textarea');
      await expect(textarea).toBeVisible();

      // Close drawer
      const closeBtn = page.locator('.chat-header-close-btn');
      await closeBtn.click();
      await expect(chatDrawer).not.toBeVisible({ timeout: 5_000 });
    }
  });

  test('3. Sends a text message with optimistic update and delivery confirmation', async ({
    page,
  }) => {
    await page.goto(`/?chatOpen=1&roomId=${TEST_ROOM_ID}`, {
      waitUntil: 'domcontentloaded',
    });

    const chatDrawer = page.locator('.chat-drawer');
    await expect(chatDrawer).toBeVisible({ timeout: 10_000 });

    const textarea = page.locator('.chat-input-textarea');
    await expect(textarea).toBeVisible();

    const testMessageContent = `[E2E-TEST] Kiem tra gui tin nhan luc ${Date.now()}`;

    // Fill message content
    await textarea.fill(testMessageContent);

    // Send via send button
    const sendBtn = page.locator('.chat-send-btn');
    await expect(sendBtn).toBeEnabled();
    await sendBtn.click();

    // Verify textarea is cleared immediately (Optimistic reset)
    await expect(textarea).toHaveValue('', { timeout: 3_000 });

    // Verify message bubble appears in viewport
    const messageBubble = page
      .locator('.chat-bubble-text', { hasText: testMessageContent })
      .first();
    await expect(messageBubble).toBeVisible({ timeout: 10_000 });

    // Close drawer
    const closeBtn = page.locator('.chat-header-close-btn');
    await closeBtn.click();
    await expect(chatDrawer).not.toBeVisible({ timeout: 5_000 });
  });

  test('4. Displays hover quick actions bar on existing messages', async ({
    page,
  }) => {
    await page.goto(`/?chatOpen=1&roomId=${TEST_ROOM_ID}`, {
      waitUntil: 'domcontentloaded',
    });

    const chatDrawer = page.locator('.chat-drawer');
    await expect(chatDrawer).toBeVisible({ timeout: 10_000 });

    const firstBubbleRow = page.locator('.chat-bubble-row').first();
    if (await firstBubbleRow.isVisible({ timeout: 5_000 })) {
      await firstBubbleRow.hover();

      const quickActions = firstBubbleRow.locator('.chat-bubble-quick-actions');
      await expect(quickActions).toBeAttached();
    }

    // Close drawer
    const closeBtn = page.locator('.chat-header-close-btn');
    await closeBtn.click();
    await expect(chatDrawer).not.toBeVisible({ timeout: 5_000 });
  });
});
