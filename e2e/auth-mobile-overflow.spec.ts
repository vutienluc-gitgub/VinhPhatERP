import { test, expect, type Page } from '@playwright/test';

/**
 * Regression: Login form horizontal overflow on narrow phones.
 *
 * Bug: the auth card forced a ~400px min-content width (Cloudflare Turnstile
 * 'normal' = fixed 300px + nowrap tab labels) → on iPhone-13-class viewports
 * (< ~390px) the card was clipped at the right edge.
 *
 * Runs against the unauthenticated /auth page. Turnstile is mocked so the test
 * renders deterministically without calling Cloudflare: the mock records the
 * requested widget size and paints a fixed-width box, reproducing the real
 * layout constraints.
 */

const VIEWPORTS = [320, 360, 375, 390];

async function mockTurnstile(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __turnstileSizes: string[] }).__turnstileSizes = [];
    (window as unknown as { turnstile: unknown }).turnstile = {
      render: (
        container: HTMLElement,
        options: {
          size?: 'normal' | 'compact';
          callback?: (t: string) => void;
        },
      ) => {
        const size = options?.size ?? 'normal';
        (
          window as unknown as { __turnstileSizes: string[] }
        ).__turnstileSizes.push(size);
        const px = size === 'compact' ? 150 : 300;
        container.innerHTML = `<div style="width:${px}px;height:65px"></div>`;
        options?.callback?.('e2e-token');
        return 'e2e-widget';
      },
      reset: () => {},
      remove: () => {},
    };
  });
}

for (const width of VIEWPORTS) {
  test(`auth card does not overflow horizontally @ ${width}px`, async ({
    page,
  }) => {
    await mockTurnstile(page);
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });

    // Interacting activates the lazily-mounted Turnstile widget.
    await page.fill('input#email', 'user@example.com');
    await page.waitForSelector('.turnstile-wrapper > div', { timeout: 10_000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(200);

    const metrics = await page.evaluate(() => {
      let maxRight = 0;
      let culprit = '';
      document.querySelectorAll('*').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.right > maxRight) {
          maxRight = rect.right;
          culprit = `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 80)}`;
        }
      });
      const wrapper = document.querySelector(
        'div[class*="max-w-[400px]"]',
      ) as HTMLElement | null;
      return {
        innerW: window.innerWidth,
        maxRight: Math.round(maxRight),
        culprit,
        wrapperRight: wrapper
          ? Math.round(wrapper.getBoundingClientRect().right)
          : null,
        sizes: (window as unknown as { __turnstileSizes: string[] })
          .__turnstileSizes,
      };
    });

    expect(
      metrics.maxRight,
      `Element overflows viewport at ${width}px: ${metrics.culprit}`,
    ).toBeLessThanOrEqual(metrics.innerW + 1);
    expect(metrics.wrapperRight).toBeLessThanOrEqual(metrics.innerW + 1);

    // Narrow viewports must request the compact (150px) widget.
    expect(metrics.sizes).toContain('compact');
  });
}

/**
 * Regression: large accessibility font sizes (iOS/Android text scaling,
 * browser zoom) must not reintroduce horizontal overflow. The card's
 * min-content width scales with the root font size, so a viewport that is fine
 * at 100% can still clip at 125–150%.
 */
const FONT_SCALES = [
  { rootPx: 20, label: '125%' },
  { rootPx: 24, label: '150%' },
];

for (const width of VIEWPORTS) {
  for (const { rootPx, label } of FONT_SCALES) {
    test(`auth card does not overflow @ ${width}px / root ${label}`, async ({
      page,
    }) => {
      await mockTurnstile(page);
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/auth', { waitUntil: 'domcontentloaded' });

      await page.addStyleTag({
        content: `html { font-size: ${rootPx}px !important; }`,
      });
      await page.fill('input#email', 'user@example.com');
      await page.waitForSelector('.turnstile-wrapper > div', {
        timeout: 10_000,
      });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(200);

      const metrics = await page.evaluate(() => {
        let maxRight = 0;
        let culprit = '';
        document.querySelectorAll('*').forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.right > maxRight) {
            maxRight = rect.right;
            culprit = `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 80)}`;
          }
        });
        return {
          innerW: window.innerWidth,
          maxRight: Math.round(maxRight),
          culprit,
        };
      });

      expect(
        metrics.maxRight,
        `Element overflows viewport at ${width}px / root ${label}: ${metrics.culprit}`,
      ).toBeLessThanOrEqual(metrics.innerW + 1);
    });
  }
}
