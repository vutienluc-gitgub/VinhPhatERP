/**
 * Print helpers for the Fabric Roll Packing List (Bảng kê danh sách cây vải).
 * Builds a standalone A5-landscape document and prints it through a hidden
 * iframe so the printed output never depends on the surrounding app layout.
 */

import type { FabricRollPackingItem } from '@/domain/inventory/packing-list.types';
import {
  calculatePackingSummary,
  groupRollsByColorAndBatch,
  normalizeGrade,
  roundWeight,
} from '@/domain/inventory/packing-list.utils';

export interface PackingListPrintMeta {
  documentNumber?: string;
  customerName?: string;
  driverName?: string;
  licensePlate?: string;
  notes?: string;
}

const COMPANY_NAME = 'CÔNG TY TNHH SX TM DỆT MAY VĨNH PHÁT';
const COMPANY_SUBLINE = 'Xưởng Dệt Nhuộm & Hoàn Tất Vải';
const DOCUMENT_TITLE = 'BẢNG KÊ CÂY VẢI (PACKING LIST)';
const ROLLS_PER_ROW = 10;

function formatDate(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildMatrixRowsHtml(rolls: FabricRollPackingItem[]): string {
  const rows: string[] = [];

  for (let start = 0; start < rolls.length; start += ROLLS_PER_ROW) {
    const chunk = rolls.slice(start, start + ROLLS_PER_ROW);
    let subtotal = 0;
    let cells = '';

    for (let i = 0; i < ROLLS_PER_ROW; i++) {
      const roll = chunk[i];
      if (roll) {
        const weight = roundWeight(Number(roll.weight_kg) || 0);
        subtotal += Number(roll.weight_kg) || 0;
        cells +=
          `<td class="cell">` +
          `<div class="code">${escapeHtml(roll.roll_code)}</div>` +
          `<div class="weight">${weight.toFixed(1)}</div>` +
          `<div class="grade">${normalizeGrade(roll.grade)}</div>` +
          `</td>`;
      } else {
        cells += '<td class="cell cell--empty"></td>';
      }
    }

    const startSeq = start + 1;
    const endSeq = start + chunk.length;
    rows.push(
      `<tr>` +
        `<th class="seq">${String(startSeq).padStart(2, '0')}-${String(endSeq).padStart(2, '0')}</th>` +
        cells +
        `<td class="subtotal">${roundWeight(subtotal).toFixed(1)}</td>` +
        `</tr>`,
    );
  }

  return rows.join('');
}

export function buildPackingListPrintHtml(
  rolls: FabricRollPackingItem[],
  meta: PackingListPrintMeta = {},
): string {
  const summary = calculatePackingSummary(rolls);
  const groups = groupRollsByColorAndBatch(rolls);
  const documentNumber = meta.documentNumber ?? 'PKL-000';
  const customerName =
    meta.customerName ?? '............................................';
  const driverName = meta.driverName ?? '............................';
  const licensePlate = meta.licensePlate ?? '................';
  const notes = meta.notes?.trim();

  const headerCells =
    `<th class="seq">STT</th>` +
    Array.from(
      { length: ROLLS_PER_ROW },
      (_, i) => `<th class="col">${String(i + 1).padStart(2, '0')}</th>`,
    ).join('') +
    `<th class="subtotal">Tổng</th>`;

  const groupsHtml = groups
    .map(
      (group) =>
        `<section class="group">` +
        `<header class="group__head">` +
        `<span>Mặt hàng: ${escapeHtml(group.fabric_type || 'Vải thành phẩm')} — Màu: ${escapeHtml(group.color_name)}` +
        `${group.lot_number ? ` (Lô: ${escapeHtml(group.lot_number)})` : ''}</span>` +
        `<span>${group.total_rolls} cây • ${group.total_weight_kg.toFixed(1)} kg • TB: ${group.average_weight_kg.toFixed(1)} kg/cây</span>` +
        `</header>` +
        `<table class="matrix"><thead><tr>${headerCells}</tr></thead>` +
        `<tbody>${buildMatrixRowsHtml(group.rolls)}</tbody></table>` +
        `</section>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>${DOCUMENT_TITLE} - ${escapeHtml(documentNumber)}</title>
<style>
  @page { size: A5 landscape; margin: 6mm 8mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: Arial, "Helvetica Neue", sans-serif;
    font-size: 8.5pt;
    color: #111;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .doc { padding: 2mm; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #333; padding-bottom: 4px; }
  .head h1 { font-size: 9.5pt; font-weight: 700; margin: 0; }
  .head .sub { font-size: 7.5pt; color: #444; margin: 2px 0 0; }
  .head .title { font-size: 10.5pt; font-weight: 800; text-align: right; }
  .head .meta { font-size: 7.5pt; color: #444; text-align: right; margin-top: 2px; }
  .info { display: flex; justify-content: space-between; gap: 8px; font-size: 7.5pt; margin: 5px 0; }
  .info p { margin: 1px 0; }
  .group { margin-bottom: 5px; }
  .group__head { display: flex; justify-content: space-between; gap: 8px; background: #eef1f5; border: 1px solid #999; border-bottom: 0; padding: 2px 4px; font-size: 7.5pt; font-weight: 700; }
  table.matrix { width: 100%; border-collapse: collapse; table-layout: fixed; }
  table.matrix th, table.matrix td { border: 1px solid #999; text-align: center; }
  table.matrix th { font-size: 6.5pt; background: #f3f4f6; font-weight: 700; padding: 1px 0; }
  .seq, .subtotal { width: 9%; }
  .col { width: 8.2%; }
  .cell { padding: 1px 0; height: 30px; vertical-align: middle; }
  .cell .code { font-size: 6pt; font-weight: 700; line-height: 1.1; }
  .cell .weight { font-size: 7pt; font-weight: 700; line-height: 1.1; }
  .cell .grade { font-size: 5.5pt; color: #555; line-height: 1.1; }
  .cell--empty { background: #fafafa; }
  .subtotal { font-size: 7pt; font-weight: 700; }
  .totals { margin-top: 4px; font-size: 8pt; font-weight: 700; }
  .sign { display: flex; justify-content: space-between; margin-top: 10px; text-align: center; font-size: 7.5pt; }
  .sign div { width: 24%; }
  .sign .role { font-weight: 700; }
  .sign .hint { font-size: 6.5pt; color: #666; font-style: italic; }
  .sign .space { height: 30px; }
</style>
</head>
<body>
<div class="doc">
  <div class="head">
    <div>
      <h1>${COMPANY_NAME}</h1>
      <p class="sub">${COMPANY_SUBLINE} — Bảng kê cây vải xuất xưởng</p>
    </div>
    <div>
      <div class="title">${DOCUMENT_TITLE}</div>
      <div class="meta">Số: <strong>${escapeHtml(documentNumber)}</strong> — Ngày: ${formatDate()}</div>
    </div>
  </div>

  <div class="info">
    <p>Đơn vị nhận hàng: <strong>${escapeHtml(customerName)}</strong></p>
    <p>Phương tiện: <strong>${escapeHtml(licensePlate)}</strong> (Tài xế: ${escapeHtml(driverName)})</p>
    <p>Tổng xuất: <strong>${summary.total_rolls}</strong> cây (<strong>${summary.total_weight_kg.toFixed(1)}</strong> kg)</p>
  </div>
  ${notes ? `<div class="info"><p>Ghi chú: <em>${escapeHtml(notes)}</em></p></div>` : ''}

  ${groupsHtml}

  <div class="totals">TỔNG CỘNG: ${summary.total_rolls} cây — ${summary.total_weight_kg.toFixed(1)} kg — Bình quân ${summary.average_weight_kg.toFixed(1)} kg/cây</div>

  <div class="sign">
    <div><p class="role">Người lập bảng</p><p class="hint">(Ký, họ tên)</p><div class="space"></div></div>
    <div><p class="role">Thủ kho xuất</p><p class="hint">(Ký, họ tên)</p><div class="space"></div></div>
    <div><p class="role">Tài xế giao nhận</p><p class="hint">(Ký, họ tên)</p><div class="space"></div></div>
    <div><p class="role">Đại diện khách hàng</p><p class="hint">(Ký, nhận đủ cây)</p><div class="space"></div></div>
  </div>
</div>
</body>
</html>`;
}

/**
 * Prints an HTML document through a hidden iframe. Unlike window.open this is
 * not blocked by popup blockers and leaves the current page untouched.
 */
export function printHtmlDocument(html: string): void {
  if (typeof document === 'undefined') return;

  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  document.body.appendChild(frame);

  const frameWindow = frame.contentWindow;
  if (!frameWindow) {
    frame.remove();
    return;
  }

  let printed = false;
  const triggerPrint = () => {
    if (printed) return;
    printed = true;
    try {
      frameWindow.focus();
      frameWindow.print();
    } finally {
      window.setTimeout(() => frame.remove(), 500);
    }
  };

  frame.addEventListener('load', triggerPrint, { once: true });
  frameWindow.document.open();
  frameWindow.document.write(html);
  frameWindow.document.close();
}

export function printPackingList(
  rolls: FabricRollPackingItem[],
  meta: PackingListPrintMeta = {},
): void {
  printHtmlDocument(buildPackingListPrintHtml(rolls, meta));
}
