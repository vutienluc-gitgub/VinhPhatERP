import QRCode from 'qrcode';

import type { ShipmentDocument } from './types';
import {
  SHIPMENT_DOCUMENT_LABELS,
  SHIPMENT_DOCUMENT_CSS,
  SHIPMENT_DOCUMENT_A5_DOT_MATRIX_CSS,
  VERIFY_BASE_URL,
} from './shipment-document.constants';
import {
  escapeHtml,
  formatText,
  formatDate,
  formatDateTime,
  formatNumber,
  makeShipmentDocumentFileName,
  toShipmentDocumentRows,
  toGroupedDocumentRows,
  paginateGroupedRows,
  type DocumentPage,
} from './shipment-document.utils';

type PrintOptions = {
  createdByName?: string;
  companyName?: string;
  verifyBaseUrl?: string;
  format?: 'A4' | 'A5_DOT_MATRIX';
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
  const companyName = options.companyName ?? 'VinhPhat';
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

  // Phân trang
  let pages: DocumentPage[] = [];
  if (isA5) {
    // Với A5 in kim, ta giới hạn số dòng để không tràn
    pages = paginateGroupedRows(groupedRows, 14, 4);
  } else {
    // Với A4 thường, không cần ngắt khắt khe, tuỳ CSS xử lý
    pages = [
      {
        page: 1,
        totalPages: 1,
        groups: groupedRows,
        isLastPage: true,
      },
    ];
  }

  const renderPageHtml = (page: DocumentPage) => {
    // Grouped table rows
    const tableRowsHtml =
      page.groups.length > 0
        ? page.groups
            .map(
              (group) => `
          <tr>
            <td class="text-center idx-cell">${group.index}</td>
            <td>${escapeHtml(group.fabricType)}</td>
            <td>${escapeHtml(group.colorName)}</td>
            <td><div class="roll-pills">${group.rolls
              .map(
                (r) =>
                  `<span class="roll-pill">${escapeHtml(r.number)}<span class="roll-qty">${escapeHtml(r.quantityText)}</span></span>`,
              )
              .join('')}</div></td>
            <td class="text-right font-bold">${escapeHtml(group.totalQuantityText)}</td>
            <td>${escapeHtml(group.note)}</td>
          </tr>`,
            )
            .join('')
        : `
        <tr>
          <td class="text-center" colspan="6">${SHIPMENT_DOCUMENT_LABELS.NO_ITEMS}</td>
        </tr>`;

    // Subtitle với Copy Label và Trang
    const subtitleParts = [SHIPMENT_DOCUMENT_LABELS.DOCUMENT_SUBTITLE];
    if (page.copyLabel) {
      subtitleParts.push(
        `<span style="font-weight:bold;color:#0f3460">${escapeHtml(page.copyLabel)}</span>`,
      );
    }
    if (page.totalPages > 1) {
      subtitleParts.push(
        `${SHIPMENT_DOCUMENT_LABELS.PAGE_LABEL} ${page.page}/${page.totalPages}`,
      );
    }
    const docSubtitleHtml = subtitleParts.join(' — ');

    return `
      <!-- HEADER -->
      <div class="header">
        <div class="brand">
          <div class="brand-name">${escapeHtml(companyName)}</div>
          <div class="doc-title">${SHIPMENT_DOCUMENT_LABELS.DOCUMENT_TITLE}</div>
          <div class="doc-subtitle">${docSubtitleHtml}</div>
        </div>
        <div class="meta-block">
          <div class="meta-row">
            <span class="meta-label">${SHIPMENT_DOCUMENT_LABELS.DOC_NUMBER}</span>
            <span class="meta-value strong">${escapeHtml(formatText(shipment.shipment_number))}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">${SHIPMENT_DOCUMENT_LABELS.DELIVERY_DATE}</span>
            <span class="meta-value">${escapeHtml(formatDate(shipment.shipment_date))}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">${SHIPMENT_DOCUMENT_LABELS.ORDER}</span>
            <span class="meta-value">${escapeHtml(orderNumber)}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">${SHIPMENT_DOCUMENT_LABELS.PRINTED_AT}</span>
            <span class="meta-value">${escapeHtml(generatedAt)}</span>
          </div>
        </div>
      </div>

      <!-- INFO CARDS -->
      <div class="info-grid">
        <div class="info-card">
          <div class="info-card-header">${SHIPMENT_DOCUMENT_LABELS.CUSTOMER_INFO}</div>
          <div class="info-card-body">
            <div class="info-row">
              <span class="info-val large">${escapeHtml(customerName)}</span>
            </div>
            <div class="info-row">
              <span class="info-key">${SHIPMENT_DOCUMENT_LABELS.CUSTOMER_CODE}</span>
              <span class="info-val">${escapeHtml(customerCode)}</span>
            </div>
            <div class="info-row">
              <span class="info-key">${SHIPMENT_DOCUMENT_LABELS.CONTACT_PERSON}</span>
              <span class="info-val">${escapeHtml(customerContact)}</span>
            </div>
            <div class="info-row">
              <span class="info-key">${SHIPMENT_DOCUMENT_LABELS.PHONE}</span>
              <span class="info-val">${escapeHtml(customerPhone)}</span>
            </div>
          </div>
        </div>
        <div class="info-card">
          <div class="info-card-header">${SHIPMENT_DOCUMENT_LABELS.DELIVERY_INFO}</div>
          <div class="info-card-body">
            <div class="info-row">
              <span class="info-key">${SHIPMENT_DOCUMENT_LABELS.DELIVERY_ADDRESS}</span>
              <span class="info-val">${escapeHtml(deliveryAddress)}</span>
            </div>
            <div class="info-row">
              <span class="info-key">${SHIPMENT_DOCUMENT_LABELS.STATUS}</span>
              <span class="info-val">${escapeHtml(formatText(shipment.status))}</span>
            </div>
            <div class="info-row">
              <span class="info-key">${SHIPMENT_DOCUMENT_LABELS.NOTES}</span>
              <span class="info-val">${escapeHtml(formatText(shipment.notes))}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- TABLE -->
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:6%" class="text-center">${SHIPMENT_DOCUMENT_LABELS.TABLE_INDEX}</th>
              <th style="width:22%">${SHIPMENT_DOCUMENT_LABELS.TABLE_FABRIC}</th>
              <th style="width:12%">${SHIPMENT_DOCUMENT_LABELS.TABLE_COLOR}</th>
              <th style="width:38%">${SHIPMENT_DOCUMENT_LABELS.TABLE_ROLL_CODE}</th>
              <th style="width:11%" class="text-right">${SHIPMENT_DOCUMENT_LABELS.TABLE_TOTAL_QTY}</th>
              <th style="width:11%">${SHIPMENT_DOCUMENT_LABELS.NOTES}</th>
            </tr>
          </thead>
          <tbody>${tableRowsHtml}
          </tbody>
        </table>
      </div>

      ${
        page.isLastPage
          ? `
      <!-- SUMMARY -->
      <div class="summary-bar">
        <div class="summary-item">
          <span class="summary-label">${SHIPMENT_DOCUMENT_LABELS.TOTAL_ROLLS}</span>
          <span class="summary-value">${totalRolls}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">${SHIPMENT_DOCUMENT_LABELS.TOTAL_QTY}</span>
          <span class="summary-value">${escapeHtml(totalSummary)}</span>
        </div>
      </div>

      <!-- SIGNATURES -->
      <div class="signature-section">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:${isA5 ? '3mm' : '5mm'};align-items:start">
          <div class="sign-cell">
            <div class="sign-title">${SHIPMENT_DOCUMENT_LABELS.SIGN_CREATOR}</div>
            <div class="sign-name">${escapeHtml(createdByName)}</div>
            <div class="sign-note">${SHIPMENT_DOCUMENT_LABELS.SIGN_INSTRUCTION}</div>
          </div>
          <div class="sign-cell">
            <div class="sign-title">${SHIPMENT_DOCUMENT_LABELS.SIGN_STOREKEEPER}</div>
            <div class="sign-name"></div>
            <div class="sign-note">${SHIPMENT_DOCUMENT_LABELS.SIGN_INSTRUCTION}</div>
          </div>
          <div class="sign-cell">
            <div class="sign-title">${SHIPMENT_DOCUMENT_LABELS.SIGN_RECEIVER}</div>
            <div class="sign-name"></div>
            <div class="sign-note">${SHIPMENT_DOCUMENT_LABELS.SIGN_INSTRUCTION}</div>
          </div>
          <div class="qr-block">
            <img src="${qrDataUrl}" alt="QR verify" />
            <div class="qr-label">${SHIPMENT_DOCUMENT_LABELS.QR_VERIFY}</div>
            <div class="qr-url">${escapeHtml(verifyUrl)}</div>
          </div>
        </div>
      </div>
      `
          : ''
      }

      <!-- FOOTER -->
      <div class="doc-footer">
        <span>${escapeHtml(companyName)} — ${SHIPMENT_DOCUMENT_LABELS.FOOTER_DISCLAIMER}</span>
        <span>${SHIPMENT_DOCUMENT_LABELS.PRINTED_AT}: ${escapeHtml(generatedAt)}</span>
      </div>
    `;
  };

  const bodyContent = pages
    .map((page) =>
      isA5
        ? `<div class="a5-page">${renderPageHtml(page)}</div>`
        : `<div class="page"><div class="accent-bar"></div>${renderPageHtml(page)}</div>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(fileName)}</title>
<style>
${isA5 ? SHIPMENT_DOCUMENT_A5_DOT_MATRIX_CSS : SHIPMENT_DOCUMENT_CSS}
</style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;

  return {
    fileName,
    html,
  };
}
