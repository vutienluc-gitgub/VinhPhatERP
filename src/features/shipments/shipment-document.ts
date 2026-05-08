import QRCode from 'qrcode';

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

export type GroupedDocumentRow = {
  index: number;
  fabricType: string;
  colorName: string;
  rolls: Array<{ number: string; quantityText: string }>;
  totalQuantityText: string;
  totalQuantityValue: number;
  unit: string;
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

const VERIFY_BASE_URL = 'https://quantri.detmayvinhphat.com/verify';

type PrintOptions = {
  createdByName?: string;
  companyName?: string;
  verifyBaseUrl?: string;
};

export function toGroupedDocumentRows(
  shipment: ShipmentDocument,
): GroupedDocumentRow[] {
  const rawRows = toShipmentDocumentRows(shipment);
  const groups = new Map<string, GroupedDocumentRow>();

  rawRows.forEach((row, idx) => {
    const unit = shipment.shipment_items?.[idx]?.unit ?? 'm';
    const key = `${row.fabricType}|${row.colorName}`;
    if (!groups.has(key)) {
      groups.set(key, {
        index: groups.size + 1,
        fabricType: row.fabricType,
        colorName: row.colorName,
        rolls: [],
        totalQuantityText: '',
        totalQuantityValue: 0,
        unit,
        note: row.note !== EMPTY_VALUE ? row.note : EMPTY_VALUE,
      });
    }
    const group = groups.get(key)!;
    group.rolls.push({
      number: row.rollNumber,
      quantityText: row.quantityText,
    });
    group.totalQuantityValue += row.quantityValue;
    group.totalQuantityText = `${formatNumber(group.totalQuantityValue)} ${unit}`;
  });

  return Array.from(groups.values());
}

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
    const unit =
      shipment.shipment_items?.find((_, idx) => idx === row.index - 1)?.unit ??
      'm';
    acc[unit] = (acc[unit] ?? 0) + row.quantityValue;
    return acc;
  }, {});
  const totalSummary = Object.entries(totalByUnit)
    .map(([unit, qty]) => `${formatNumber(qty)} ${unit}`)
    .join(' · ');

  const customerName = formatText(shipment.customers?.name);
  const customerCode = formatText(shipment.customers?.code);
  const customerPhone = formatText(shipment.customers?.phone);
  const customerContact = formatText(shipment.customers?.contact_person);
  const deliveryAddress = formatText(
    shipment.delivery_address || shipment.customers?.address,
  );
  const orderNumber = formatText(shipment.orders?.order_number);
  const companyName = options.companyName ?? 'VinhPhat';
  const createdByName = options.createdByName ?? EMPTY_VALUE;

  // QR code for digital verification
  const verifyUrl = `${
    options.verifyBaseUrl ?? VERIFY_BASE_URL
  }/${encodeURIComponent(shipment.shipment_number)}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 96,
    margin: 1,
    color: { dark: '#0f3460', light: '#ffffff' },
  });

  // Grouped table rows: 1 row per fabric+color, with roll pills
  const tableRows =
    groupedRows.length > 0
      ? groupedRows
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
        <td class="text-center" colspan="6">Không có dòng hàng.</td>
      </tr>`;
  const totalRolls = flatRows.length;

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(fileName)}</title>
<style>
  @page {
    size: A4 portrait;
    margin: 0;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    color: #1a2533;
    font-family: "Segoe UI", "Arial", sans-serif;
    font-size: 10.5pt;
    line-height: 1.5;
    background: #fff;
  }

  /* ── Top accent bar ── */
  .accent-bar {
    height: 5px;
    background: linear-gradient(90deg, #0f3460 0%, #1a6bb5 60%, #3da5e0 100%);
  }

  .page {
    padding: 8mm 12mm 6mm;
  }

  /* ── Header ── */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    gap: 10mm;
    margin-bottom: 6mm;
    padding-bottom: 5mm;
    border-bottom: 1.5px solid #dce6f0;
  }
  .brand {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .brand-name {
    font-size: 13pt;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #0f3460;
  }
  .doc-title {
    font-size: 20pt;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #1a2533;
    margin-top: 1mm;
  }
  .doc-subtitle {
    font-size: 9pt;
    color: #6b7d8f;
    margin-top: 1mm;
  }
  .meta-block {
    min-width: 60mm;
    background: #f0f5fb;
    border: 1px solid #cdd9e8;
    border-left: 3.5px solid #1a6bb5;
    border-radius: 4px;
    padding: 3.5mm 4.5mm;
    display: flex;
    flex-direction: column;
    gap: 1.2mm;
  }
  .meta-row {
    display: flex;
    align-items: baseline;
    gap: 2mm;
    font-size: 9.5pt;
  }
  .meta-label {
    min-width: 24mm;
    color: #5b6f82;
    font-size: 8.5pt;
    flex-shrink: 0;
  }
  .meta-value {
    color: #1a2533;
    font-weight: 500;
  }
  .meta-value.strong {
    font-size: 11pt;
    font-weight: 700;
    color: #0f3460;
  }

  /* ── Info cards ── */
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4mm;
    margin-bottom: 5mm;
  }
  .info-card {
    border: 1px solid #dce6f0;
    border-radius: 5px;
    overflow: hidden;
  }
  .info-card-header {
    background: #0f3460;
    color: #fff;
    font-size: 8pt;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 1.8mm 4mm;
  }
  .info-card-body {
    padding: 3.5mm 4mm;
    background: #fff;
    display: flex;
    flex-direction: column;
    gap: 1.2mm;
  }
  .info-row {
    display: flex;
    gap: 2mm;
    font-size: 9.5pt;
  }
  .info-key {
    min-width: 26mm;
    color: #6b7d8f;
    font-size: 8.5pt;
    flex-shrink: 0;
  }
  .info-val {
    color: #1a2533;
    font-weight: 500;
  }
  .info-val.large {
    font-size: 11pt;
    font-weight: 700;
    color: #0f3460;
  }

  /* ── Table ── */
  .table-wrap {
    border: 1px solid #cdd9e8;
    border-radius: 5px;
    overflow: hidden;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  thead tr {
    background: #0f3460;
    color: #fff;
  }
  th {
    font-size: 9pt;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-align: left;
    padding: 2.8mm 2.8mm;
    border-right: 1px solid rgba(255,255,255,0.15);
  }
  th:last-child { border-right: none; }
  td {
    font-size: 9.5pt;
    padding: 2.4mm 2.8mm;
    border-bottom: 1px solid #e8eef5;
    border-right: 1px solid #e8eef5;
    vertical-align: middle;
  }
  td:last-child { border-right: none; }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:nth-child(even) { background: #f6f9fd; }
  tbody tr:hover { background: #edf3fb; }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .font-bold { font-weight: 700; }
  .idx-cell {
    color: #8a9bb0;
    font-size: 8.5pt;
  }

  /* ── Roll pills ── */
  .roll-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5mm;
  }
  .roll-pill {
    display: inline-flex;
    align-items: center;
    gap: 1mm;
    background: #edf3fb;
    border: 1px solid #cdd9e8;
    border-radius: 3px;
    padding: 0.5mm 2mm;
    font-size: 8pt;
    color: #1a2533;
    white-space: nowrap;
  }
  .roll-qty {
    color: #5b6f82;
    font-size: 7.5pt;
  }

  /* ── QR block ── */
  .qr-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5mm;
    padding: 3mm;
    border: 1px solid #dce6f0;
    border-radius: 5px;
    background: #f8fbff;
  }
  .qr-block img {
    width: 22mm;
    height: 22mm;
    display: block;
  }
  .qr-label {
    font-size: 7pt;
    color: #6b7d8f;
    text-align: center;
  }
  .qr-url {
    font-size: 6.5pt;
    color: #1a6bb5;
    text-align: center;
    word-break: break-all;
  }

  /* ── Summary bar ── */
  .summary-bar {
    margin-top: 4mm;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 3mm 5mm;
    background: #f0f5fb;
    border: 1px solid #cdd9e8;
    border-left: 3.5px solid #1a6bb5;
    border-radius: 4px;
    font-size: 9.5pt;
  }
  .summary-item { display: flex; gap: 2mm; align-items: baseline; }
  .summary-label { color: #5b6f82; }
  .summary-value { font-weight: 700; font-size: 11pt; color: #0f3460; }

  /* ── Signature ── */
  .signature-section {
    margin-top: 8mm;
  }
  .signature-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 5mm;
  }
  .sign-cell {
    border: 1px dashed #c0cdd9;
    border-radius: 5px;
    padding: 3mm 4mm;
    text-align: center;
    min-height: 32mm;
  }
  .sign-title {
    font-size: 8.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #0f3460;
    border-bottom: 1px solid #e0e8f0;
    padding-bottom: 2mm;
    margin-bottom: 2mm;
  }
  .sign-name {
    font-size: 9pt;
    color: #3a4d61;
    min-height: 5mm;
  }
  .sign-note {
    margin-top: 14mm;
    font-size: 8pt;
    color: #8a9bb0;
    font-style: italic;
  }

  /* ── Footer ── */
  .doc-footer {
    margin-top: 6mm;
    padding-top: 3mm;
    border-top: 1px solid #e0e8f0;
    display: flex;
    justify-content: space-between;
    font-size: 7.5pt;
    color: #9aaab8;
  }
</style>
</head>
<body>
  <div class="accent-bar"></div>
  <div class="page">

    <!-- HEADER -->
    <div class="header">
      <div class="brand">
        <div class="brand-name">${escapeHtml(companyName)}</div>
        <div class="doc-title">Phiếu xuất kho</div>
        <div class="doc-subtitle">Chứng từ giao hàng &amp; xuất kho thành phẩm</div>
      </div>
      <div class="meta-block">
        <div class="meta-row">
          <span class="meta-label">Số phiếu</span>
          <span class="meta-value strong">${escapeHtml(formatText(shipment.shipment_number))}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Ngày giao</span>
          <span class="meta-value">${escapeHtml(formatDate(shipment.shipment_date))}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Đơn hàng</span>
          <span class="meta-value">${escapeHtml(orderNumber)}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">In lúc</span>
          <span class="meta-value">${escapeHtml(generatedAt)}</span>
        </div>
      </div>
    </div>

    <!-- INFO CARDS -->
    <div class="info-grid">
      <div class="info-card">
        <div class="info-card-header">Thông tin khách hàng</div>
        <div class="info-card-body">
          <div class="info-row">
            <span class="info-val large">${escapeHtml(customerName)}</span>
          </div>
          <div class="info-row">
            <span class="info-key">Mã khách</span>
            <span class="info-val">${escapeHtml(customerCode)}</span>
          </div>
          <div class="info-row">
            <span class="info-key">Người liên hệ</span>
            <span class="info-val">${escapeHtml(customerContact)}</span>
          </div>
          <div class="info-row">
            <span class="info-key">Số điện thoại</span>
            <span class="info-val">${escapeHtml(customerPhone)}</span>
          </div>
        </div>
      </div>
      <div class="info-card">
        <div class="info-card-header">Thông tin giao hàng</div>
        <div class="info-card-body">
          <div class="info-row">
            <span class="info-key">Địa chỉ giao</span>
            <span class="info-val">${escapeHtml(deliveryAddress)}</span>
          </div>
          <div class="info-row">
            <span class="info-key">Trạng thái</span>
            <span class="info-val">${escapeHtml(formatText(shipment.status))}</span>
          </div>
          <div class="info-row">
            <span class="info-key">Ghi chú</span>
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
            <th style="width:6%"  class="text-center">STT</th>
            <th style="width:22%">Loại vải</th>
            <th style="width:12%">Màu</th>
            <th style="width:38%">Mã cuộn</th>
            <th style="width:11%" class="text-right">Tổng SL</th>
            <th style="width:11%">Ghi chú</th>
          </tr>
        </thead>
        <tbody>${tableRows}
        </tbody>
      </table>
    </div>

    <!-- SUMMARY -->
    <div class="summary-bar">
      <div class="summary-item">
        <span class="summary-label">Số cuộn:</span>
        <span class="summary-value">${totalRolls}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Tổng số lượng:</span>
        <span class="summary-value">${escapeHtml(totalSummary)}</span>
      </div>
    </div>

    <!-- SIGNATURES + QR -->
    <div class="signature-section">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:5mm;align-items:start">
        <div class="sign-cell">
          <div class="sign-title">Người lập phiếu</div>
          <div class="sign-name">${escapeHtml(createdByName)}</div>
          <div class="sign-note">Ký và ghi rõ họ tên</div>
        </div>
        <div class="sign-cell">
          <div class="sign-title">Thủ kho</div>
          <div class="sign-name"></div>
          <div class="sign-note">Ký và ghi rõ họ tên</div>
        </div>
        <div class="sign-cell">
          <div class="sign-title">Người nhận hàng</div>
          <div class="sign-name"></div>
          <div class="sign-note">Ký và ghi rõ họ tên</div>
        </div>
        <div class="qr-block">
          <img src="${qrDataUrl}" alt="QR verify" />
          <div class="qr-label">Quét để xác minh</div>
          <div class="qr-url">${escapeHtml(verifyUrl)}</div>
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="doc-footer">
      <span>${escapeHtml(companyName)} — Tài liệu nội bộ, không có giá trị pháp lý khi không có chữ ký.</span>
      <span>In lúc: ${escapeHtml(generatedAt)}</span>
    </div>

  </div>
</body>
</html>`;

  return {
    fileName,
    html,
  };
}

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
