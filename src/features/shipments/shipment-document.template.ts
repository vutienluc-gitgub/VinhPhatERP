import QRCode from 'qrcode';

import type { ShipmentDocument } from '@/domain/shipments/types';
import { renderA4PageHtml } from '@/features/shipments/shipment-document-a4';
import { renderA5LotMatrixHtml } from '@/features/shipments/shipment-document-a5';
import { buildMarginToolbarHtml } from '@/features/shipments/shipment-document-toolbar';
import { BRAND_INFO } from '@/shared/constants/brand';

import {
  SHIPMENT_DOCUMENT_LABELS,
  SHIPMENT_DOCUMENT_CSS,
  SHIPMENT_DOCUMENT_A5_DOT_MATRIX_CSS,
  VERIFY_BASE_URL,
} from './shipment-document.constants';
import {
  escapeHtml,
  formatText,
  formatDateTime,
  formatNumber,
  makeShipmentDocumentFileName,
  toShipmentDocumentRows,
  toGroupedDocumentRows,
  type DocumentPage,
} from './shipment-document.utils';

export type PrintOptions = {
  createdByName?: string;
  companyName?: string;
  companyAddress?: string;
  companyTaxCode?: string;
  companyPhone?: string;
  logoUrl?: string;
  showLogo?: boolean;
  showQr?: boolean;
  footerNote?: string;
  dotMatrixWidth?: string;
  dotMatrixHeight?: string;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  verifyBaseUrl?: string;
  format?: 'A4' | 'A5_DOT_MATRIX';
  showMarginToolbar?: boolean;
};

export async function buildShipmentPrintHtml(
  shipment: ShipmentDocument,
  options: PrintOptions = {},
): Promise<{
  fileName: string;
  html: string;
}> {
  const fileName = makeShipmentDocumentFileName(shipment);
  const generatedAt = formatDateTime(new Date());
  const flatRows = toShipmentDocumentRows(shipment);
  const groupedRows = toGroupedDocumentRows(shipment);

  // Totals across all units
  const totalByUnit = flatRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.unit] = (acc[row.unit] ?? 0) + row.quantityValue;
    return acc;
  }, {});
  const totalSummary = Object.entries(totalByUnit)
    .map(([unit, qty]) => `${formatNumber(qty)} ${unit}`)
    .join(' · ');

  const totalRolls = flatRows.length;

  const customerName = formatText(shipment.customers?.name);
  const customerCode = formatText(shipment.customers?.code);
  const customerPhone = formatText(shipment.customers?.phone);
  const customerContact = formatText(shipment.customers?.contact_person);
  const deliveryAddress = formatText(
    shipment.delivery_address || shipment.customers?.address,
  );
  const orderNumber = formatText(shipment.orders?.order_number);
  const companyName = options.companyName ?? BRAND_INFO.SHORT_LEGAL_NAME;
  const companyAddress = options.companyAddress ?? BRAND_INFO.SHORT_ADDRESS;
  const companyTaxCode = options.companyTaxCode ?? BRAND_INFO.TAX_CODE;
  const companyPhone = options.companyPhone ?? BRAND_INFO.PHONE;
  const createdByName =
    options.createdByName ?? SHIPMENT_DOCUMENT_LABELS.EMPTY_VALUE;

  // QR code for digital verification
  const verifyUrl = `${
    options.verifyBaseUrl ?? VERIFY_BASE_URL
  }/${encodeURIComponent(shipment.shipment_number)}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 96,
    margin: 1,
    color: { dark: '#0f3460', light: '#ffffff' },
  });

  const isA5 = options.format === 'A5_DOT_MATRIX';

  // Phân trang: Đối với A5 in kim luôn luôn cố định 1 trang duy nhất, không sang trang thứ 2
  const pages: DocumentPage[] = [
    {
      page: 1,
      totalPages: 1,
      groups: groupedRows,
      isLastPage: true,
    },
  ];

  const showLogo = options.showLogo !== false;
  const showQr = options.showQr !== false;
  const logoSrc = options.logoUrl || '/brand/logo-symbol-monochrome-black.svg';
  const footerText =
    options.footerNote || SHIPMENT_DOCUMENT_LABELS.FOOTER_DISCLAIMER;

  const bodyContent = isA5
    ? `<div class="a5-page">${renderA5LotMatrixHtml({
        groupedRows,
        showLogo,
        logoSrc,
        companyName,
        companyAddress,
        companyTaxCode,
        companyPhone,
        shipment,
        orderNumber,
        customerName,
        customerCode,
        customerContact,
        customerPhone,
        deliveryAddress,
        totalRolls,
        totalSummary,
        generatedAt,
      })}</div>`
    : pages
        .map(
          (page) =>
            `<div class="page"><div class="accent-bar"></div>${renderA4PageHtml(
              {
                page,
                isA5,
                showLogo,
                logoSrc,
                companyName,
                shipment,
                orderNumber,
                customerName,
                customerCode,
                customerContact,
                customerPhone,
                deliveryAddress,
                totalRolls,
                totalSummary,
                createdByName,
                showQr,
                qrDataUrl,
                verifyUrl,
                footerText,
                generatedAt,
              },
            )}</div>`,
        )
        .join('');

  const customStyles =
    isA5 &&
    (options.dotMatrixWidth || options.dotMatrixHeight || options.margin)
      ? `
        @page {
          size: ${options.dotMatrixWidth || '200mm'} ${options.dotMatrixHeight || '140mm'};
          margin: 0;
        }
        .a5-page {
          width: ${options.dotMatrixWidth || '200mm'};
          height: ${options.dotMatrixHeight || '140mm'};
          padding-top: ${options.margin?.top || '2mm'};
          padding-right: ${options.margin?.right || '3.5mm'};
          padding-bottom: ${options.margin?.bottom || '2mm'};
          padding-left: ${options.margin?.left || '3.5mm'};
        }
      `
      : '';

  const initialTop = parseFloat(options.margin?.top || '2') || 2;
  const initialBottom = parseFloat(options.margin?.bottom || '2') || 2;
  const initialLeft = parseFloat(options.margin?.left || '3.5') || 3.5;
  const initialRight = parseFloat(options.margin?.right || '3.5') || 3.5;

  const marginToolbarHtml =
    isA5 && options.showMarginToolbar
      ? buildMarginToolbarHtml(
          initialTop,
          initialBottom,
          initialLeft,
          initialRight,
        )
      : '';

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(fileName)}</title>
<style>
${isA5 ? SHIPMENT_DOCUMENT_A5_DOT_MATRIX_CSS : SHIPMENT_DOCUMENT_CSS}
${customStyles}
</style>
</head>
<body>
  ${marginToolbarHtml}
  ${bodyContent}
</body>
</html>`;

  return {
    fileName,
    html,
  };
}
