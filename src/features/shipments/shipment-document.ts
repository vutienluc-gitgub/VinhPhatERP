import type { ShipmentDocument } from './types';
import { buildShipmentPrintHtml } from './shipment-document.template';
export * from './shipment-document.constants';
export * from './shipment-document.utils';
export * from './shipment-document.template';

type PrintOptions = {
  createdByName?: string;
  companyName?: string;
  verifyBaseUrl?: string;
};

export async function exportShipmentToPdf(
  shipment: ShipmentDocument,
  options: PrintOptions = {},
): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Không thể in PDF ngoài môi trường trình duyệt.');
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
    throw new Error('Không thể mở trình in PDF trong trình duyệt này.');
  }

  const cleanup = () => {
    window.setTimeout(() => {
      printFrame.remove();
    }, 1_000);
  };

  let printed = false;
  const triggerPrint = () => {
    if (printed) return;
    printed = true;

    frameWindow.focus();
    frameWindow.print();
    cleanup();
  };

  frameWindow.addEventListener('afterprint', cleanup, { once: true });
  printFrame.addEventListener('load', triggerPrint, { once: true });

  frameWindow.document.open();
  frameWindow.document.write(html);
  frameWindow.document.close();

  if (frameWindow.document.readyState === 'complete') {
    triggerPrint();
  }
}
