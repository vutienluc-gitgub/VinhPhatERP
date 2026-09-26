import type { ShipmentDocument } from '@/domain/shipments/types';

import {
  buildShipmentPrintHtml,
  type PrintOptions,
} from './shipment-document.template';
import {
  SHIPMENT_DOCUMENT_ERRORS,
  PRINT_CLEANUP_DELAY_MS,
} from './shipment-document.constants';

export * from './shipment-document.constants';
export * from './shipment-document.utils';
export * from './shipment-document.template';

export async function exportShipmentToPdf(
  shipment: ShipmentDocument,
  options: PrintOptions = {},
): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error(SHIPMENT_DOCUMENT_ERRORS.NOT_BROWSER_ENV);
  }

  const { html } = await buildShipmentPrintHtml(shipment, options);
  const printFrame = document.createElement('iframe');

  printFrame.setAttribute('aria-hidden', 'true');
  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '0';
  printFrame.style.height = '0';
  printFrame.style.border = '0';

  document.body.appendChild(printFrame);

  const frameWindow = printFrame.contentWindow;
  if (!frameWindow) {
    printFrame.remove();
    throw new Error(SHIPMENT_DOCUMENT_ERRORS.CANNOT_OPEN_PRINTER);
  }

  const cleanup = () => {
    window.setTimeout(() => {
      printFrame.remove();
    }, PRINT_CLEANUP_DELAY_MS);
  };

  let printed = false;
  const triggerPrint = async () => {
    if (printed) return;
    printed = true;

    // Đảm bảo toàn bộ hình ảnh (logo, QR) đã nạp và giải mã xong trước khi mở hộp thoại in
    try {
      const images = Array.from(frameWindow.document.images);
      await Promise.all(
        images.map(
          (img) =>
            img.decode?.().catch(() => {}) ??
            (img.complete
              ? Promise.resolve()
              : new Promise<void>((resolve) => {
                  img.onload = () => resolve();
                  img.onerror = () => resolve();
                })),
        ),
      );
    } catch {
      // Tiếp tục in nếu có lỗi phụ
    }

    frameWindow.focus();
    frameWindow.print();
    cleanup();
  };

  frameWindow.addEventListener('afterprint', cleanup, { once: true });
  printFrame.addEventListener('load', () => void triggerPrint(), {
    once: true,
  });

  frameWindow.document.open();
  frameWindow.document.write(html);
  frameWindow.document.close();

  // Nhường 1 microtask/tick để iframe hoàn tất parse DOM & ảnh
  setTimeout(() => {
    void triggerPrint();
  }, 100);
}
