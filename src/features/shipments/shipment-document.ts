import type { ShipmentDocument } from './types';

const EMPTY_VALUE = '—';

export type ShipmentDocumentRow = {
  index: number;
  rollNumber: string;
  fabricType: string;
  colorName: string;
  quantityText: string;
  quantityValue: number;
  note: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatText(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : EMPTY_VALUE;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return EMPTY_VALUE;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('vi-VN');
}

function formatDateTime(value: Date): string {
  return value.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value))
    return EMPTY_VALUE;

  return value.toLocaleString('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

export function makeShipmentDocumentFileName(
  shipment: Pick<ShipmentDocument, 'shipment_number' | 'shipment_date'>,
): string {
  const safeNumber = shipment.shipment_number
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '_');
  const safeDate =
    shipment.shipment_date.replace(/[^0-9-]/g, '') ||
    new Date().toISOString().slice(0, 10);
  return `phieu_xuat_${safeNumber}_${safeDate}.pdf`;
}

export function toShipmentDocumentRows(
  shipment: ShipmentDocument,
): ShipmentDocumentRow[] {
  return (shipment.shipment_items ?? [])
    .slice()
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((item, index) => {
      const quantityValue = Number(item.quantity ?? 0);
      const rollLength =
        item.roll_length_m === null || item.roll_length_m === undefined
          ? null
          : Number(item.roll_length_m);
      const rollMeta =
        rollLength && !Number.isNaN(rollLength)
          ? ` (${formatNumber(rollLength)}m)`
          : '';

      return {
        index: index + 1,
        rollNumber: item.roll_number
          ? `${item.roll_number}${rollMeta}`
          : EMPTY_VALUE,
        fabricType: formatText(item.fabric_type),
        colorName: formatText(item.color_name),
        quantityText: `${formatNumber(quantityValue)} ${item.unit || 'm'}`,
        quantityValue,
        note: formatText(item.notes),
      };
    });
}

export function buildShipmentPrintHtml(shipment: ShipmentDocument): {
  fileName: string;
  html: string;
} {
  const fileName = makeShipmentDocumentFileName(shipment);
  const generatedAt = formatDateTime(new Date());
  const rows = toShipmentDocumentRows(shipment);
  const totalQuantity = rows.reduce((sum, row) => sum + row.quantityValue, 0);
  const customerName = formatText(shipment.customers?.name);
  const customerCode = formatText(shipment.customers?.code);
  const customerPhone = formatText(shipment.customers?.phone);
  const customerContact = formatText(shipment.customers?.contact_person);
  const deliveryAddress = formatText(
    shipment.delivery_address || shipment.customers?.address,
  );
  const orderNumber = formatText(shipment.orders?.order_number);

  const tableRows =
    rows.length > 0
      ? rows
          .map(
            (row) => `
        <tr>
          <td class="text-center">${row.index}</td>
          <td>${escapeHtml(row.rollNumber)}</td>
          <td>${escapeHtml(row.fabricType)}</td>
          <td>${escapeHtml(row.colorName)}</td>
          <td class="text-right">${escapeHtml(row.quantityText)}</td>
          <td>${escapeHtml(row.note)}</td>
        </tr>`,
          )
          .join('')
      : `
      <tr>
        <td class="text-center" colspan="6">Không có dòng hàng.</td>
      </tr>`;

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(fileName)}</title>
<style>
  @page { size: A4 portrait; margin: 12mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    color: #16202a;
    font-family: "Segoe UI", Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.45;
  }
  .page {
    padding: 4mm 2mm;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12mm;
    border-bottom: 2px solid #183153;
    padding-bottom: 4mm;
    margin-bottom: 5mm;
  }
  .title-block h1 {
    margin: 0;
    font-size: 18pt;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .title-block p,
  .meta-block p,
  .info-card p,
  .summary p,
  .sign-cell p {
    margin: 0;
  }
  .doc-subtitle {
    margin-top: 2mm;
    color: #4c5a67;
  }
  .meta-block {
    min-width: 58mm;
    border: 1px solid #c9d4df;
    border-radius: 4px;
    padding: 3mm 4mm;
    background: #f7f9fc;
  }
  .meta-label {
    display: inline-block;
    min-width: 30mm;
    color: #5b6773;
  }
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4mm;
    margin-bottom: 5mm;
  }
  .info-card {
    border: 1px solid #d7e1ea;
    border-radius: 4px;
    padding: 4mm;
    background: #fff;
  }
  .info-card h2 {
    margin: 0 0 2mm;
    font-size: 11pt;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #183153;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 2mm;
  }
  thead tr {
    background: #183153;
    color: #fff;
  }
  th,
  td {
    border: 1px solid #c9d4df;
    padding: 2.6mm 2.4mm;
    vertical-align: top;
  }
  th {
    font-size: 10pt;
    text-align: left;
  }
  td {
    font-size: 10pt;
  }
  tbody tr:nth-child(even) {
    background: #f8fbfd;
  }
  .text-center {
    text-align: center;
  }
  .text-right {
    text-align: right;
  }
  .summary {
    margin-top: 4mm;
    display: flex;
    justify-content: space-between;
    gap: 4mm;
    padding: 3mm 4mm;
    border: 1px solid #d7e1ea;
    border-radius: 4px;
    background: #f7f9fc;
  }
  .signature-grid {
    margin-top: 8mm;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6mm;
  }
  .sign-cell {
    text-align: center;
    min-height: 34mm;
  }
  .sign-cell strong {
    display: block;
    margin-bottom: 2mm;
    text-transform: uppercase;
  }
  .sign-note {
    margin-top: 20mm;
    color: #66727d;
    font-size: 9pt;
  }
</style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="title-block">
        <h1>Phiếu xuất kho</h1>
        <p class="doc-subtitle">Chứng từ giao hàng được sinh từ hệ thống VinhPhat App V2.</p>
      </div>
      <div class="meta-block">
        <p><span class="meta-label">Số phiếu:</span> <strong>${escapeHtml(formatText(shipment.shipment_number))}</strong></p>
        <p><span class="meta-label">Ngày giao:</span> ${escapeHtml(formatDate(shipment.shipment_date))}</p>
        <p><span class="meta-label">Đơn hàng:</span> ${escapeHtml(orderNumber)}</p>
        <p><span class="meta-label">In lúc:</span> ${escapeHtml(generatedAt)}</p>
      </div>
    </div>

    <div class="info-grid">
      <section class="info-card">
        <h2>Khách hàng</h2>
        <p><strong>${escapeHtml(customerName)}</strong></p>
        <p>Mã khách: ${escapeHtml(customerCode)}</p>
        <p>Người liên hệ: ${escapeHtml(customerContact)}</p>
        <p>Số điện thoại: ${escapeHtml(customerPhone)}</p>
      </section>
      <section class="info-card">
        <h2>Giao hàng</h2>
        <p><strong>Địa chỉ giao:</strong> ${escapeHtml(deliveryAddress)}</p>
        <p><strong>Trạng thái:</strong> ${escapeHtml(formatText(shipment.status))}</p>
        <p><strong>Ghi chú:</strong> ${escapeHtml(formatText(shipment.notes))}</p>
      </section>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 8%">STT</th>
          <th style="width: 24%">Mã cuộn</th>
          <th style="width: 24%">Loại vải</th>
          <th style="width: 14%">Màu</th>
          <th style="width: 14%">Số lượng</th>
          <th style="width: 16%">Ghi chú</th>
        </tr>
      </thead>
      <tbody>${tableRows}
      </tbody>
    </table>

    <div class="summary">
      <p><strong>Số dòng hàng:</strong> ${rows.length}</p>
      <p><strong>Tổng số lượng:</strong> ${escapeHtml(formatNumber(totalQuantity))} m</p>
    </div>

    <div class="signature-grid">
      <div class="sign-cell">
        <strong>Người lập phiếu</strong>
        <p class="sign-note">Ký và ghi rõ họ tên</p>
      </div>
      <div class="sign-cell">
        <strong>Thủ kho</strong>
        <p class="sign-note">Ký và ghi rõ họ tên</p>
      </div>
      <div class="sign-cell">
        <strong>Người nhận hàng</strong>
        <p class="sign-note">Ký và ghi rõ họ tên</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  return {
    fileName,
    html,
  };
}

export function exportShipmentToPdf(shipment: ShipmentDocument): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Không thể in PDF ngoài môi trường trình duyệt.');
  }

  const { html } = buildShipmentPrintHtml(shipment);
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
