/**
 * Print Template Engine — Centralized print window manager.
 *
 * Replaces duplicated `window.open` + `document.write` + inline CSS
 * pattern that was repeated across 3+ print modals.
 *
 * Features:
 *   - Popup-blocked detection with user alert
 *   - Configurable delay for SVG render (barcode/QR)
 *   - Standardized CSS injection via print-template.css.ts
 */

/* ─── Constants ─── */

const MESSAGES = {
  popupBlocked:
    'Trình duyệt đã chặn popup. Vui lòng cho phép mở popup để in tem.',
} as const;

const DEFAULT_PRINT_DELAY = 500;

/* ─── Types ─── */

export type PrintTemplateConfig = {
  /** Document title shown in the print dialog / tab title */
  title: string;
  /** Raw CSS string to inject into the print window */
  css: string;
  /** Delay (ms) before calling `window.print()`. Default: 500 */
  printDelay?: number;
};

/* ─── Public API ─── */

/**
 * Opens a new browser window, injects the content of `contentElement`
 * with the given CSS, and triggers the print dialog.
 *
 * @param contentElement — The DOM element whose `innerHTML` will be printed
 * @param config — Print configuration (title, CSS, delay)
 *
 * @example
 * openPrintWindow(printAreaRef.current, {
 *   title: `QR - ${receipt.receipt_number}`,
 *   css: LOT_TAG_CSS,
 * });
 */
export function openPrintWindow(
  contentElement: HTMLElement | null,
  config: PrintTemplateConfig,
): void {
  if (!contentElement) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert(MESSAGES.popupBlocked);
    return;
  }

  const delay = config.printDelay ?? DEFAULT_PRINT_DELAY;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${config.title}</title>
        <style>${config.css}</style>
      </head>
      <body>${contentElement.innerHTML}</body>
    </html>
  `);
  printWindow.document.close();

  setTimeout(() => {
    printWindow.print();
  }, delay);
}
