import type { ShipmentDocument } from '@/domain/shipments/types';
import { SHIPMENT_DOCUMENT_LABELS } from '@/features/shipments/shipment-document.constants';
import {
  escapeHtml,
  formatText,
  formatDate,
  type GroupedDocumentRow,
} from '@/features/shipments/shipment-document.utils';

export interface RenderA5Params {
  groupedRows: GroupedDocumentRow[];
  showLogo: boolean;
  logoSrc: string;
  companyName: string;
  companyAddress: string;
  companyTaxCode: string;
  companyPhone: string;
  shipment: ShipmentDocument;
  orderNumber?: string;
  customerName: string;
  customerCode: string;
  customerContact: string;
  customerPhone: string;
  deliveryAddress: string;
  totalRolls: number;
  totalSummary: string;
  generatedAt: string;
}

export function renderA5LotMatrixHtml(params: RenderA5Params): string {
  const {
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
  } = params;

  const lotCardsHtml = groupedRows
    .map((group) => {
      const rollsHtml =
        group.rolls.length > 0
          ? group.rolls
              .map((r, idx) => {
                const rawVal = r.quantityText.replace(/\s*kg$/i, '').trim();
                const match = r.number.match(/(\d+)$/);
                const rollNum = match?.[1] ?? String(idx + 1).padStart(2, '0');
                return `
              <div class="a5-matrix-cell">
                <span class="a5-roll-idx">#${escapeHtml(rollNum)}</span>
                <span class="a5-roll-val">${escapeHtml(rawVal)}</span>
              </div>`;
              })
              .join('')
          : `<div style="grid-column:1/-1;text-align:center;padding:1mm;font-size:7.5pt;">${SHIPMENT_DOCUMENT_LABELS.NO_ITEMS}</div>`;

      return `
        <div class="a5-lot-card">
          <div class="a5-lot-header">
            <div class="a5-lot-title">
              <span class="a5-fabric-name">${escapeHtml(group.fabricType)}</span>
              ${group.colorName && group.colorName !== '—' ? `<span class="a5-color-badge">${escapeHtml(group.colorName)}</span>` : ''}
            </div>
            <div class="a5-lot-stats">
              <span>${group.rolls.length} cây</span> · <span>${escapeHtml(group.totalQuantityText)}</span>
            </div>
          </div>
          <div class="a5-roll-matrix">
            ${rollsHtml}
          </div>
        </div>`;
    })
    .join('');

  return `
    <!-- A5 COMPACT HEADER -->
    <div class="a5-header">
      <div class="a5-header-left">
        ${showLogo ? `<img src="${escapeHtml(logoSrc)}" alt="Logo" class="a5-brand-logo" />` : ''}
        <div class="a5-comp-info">
          <div class="a5-comp-name">${escapeHtml(companyName)}</div>
          <div class="a5-comp-sub">${escapeHtml(companyAddress)}</div>
          <div class="a5-comp-meta">MST: ${escapeHtml(companyTaxCode)} · Hotline: ${escapeHtml(companyPhone)}</div>
        </div>
      </div>
      <div class="a5-header-center">
        <div class="a5-doc-title">PHIẾU XUẤT KHO</div>
        <div class="a5-doc-sub">(KIÊM BẢNG KÊ CÂY VẢI)</div>
      </div>
      <div class="a5-header-right">
        <div><b>Số:</b> <span class="a5-doc-no">${escapeHtml(formatText(shipment.shipment_number))}</span></div>
        <div><b>Ngày:</b> ${escapeHtml(formatDate(shipment.shipment_date))}</div>
        ${orderNumber && orderNumber !== '—' ? `<div><b>ĐH:</b> ${escapeHtml(orderNumber)}</div>` : ''}
      </div>
    </div>

    <!-- A5 COMPACT INFO BAR -->
    <div class="a5-info-bar">
      <div class="a5-info-col">
        <div><b>Khách hàng:</b> ${escapeHtml(customerName)} ${customerCode !== '—' ? `(${escapeHtml(customerCode)})` : ''}</div>
        <div><b>Người nhận:</b> ${escapeHtml(customerContact)} ${customerPhone !== '—' ? `· SĐT: ${escapeHtml(customerPhone)}` : ''}</div>
      </div>
      <div class="a5-info-col">
        <div><b>Địa chỉ giao:</b> ${escapeHtml(deliveryAddress)}</div>
        <div><b>Vận chuyển:</b> ${escapeHtml(shipment.vehicle_info || '—')} ${shipment.receiver_name ? `· Tài xế: ${escapeHtml(shipment.receiver_name)}` : ''}</div>
      </div>
    </div>

    <!-- LOT MATRIX CARDS (DÀNH TOÀN BỘ KHÔNG GIAN CHO LOT MATRIX CARD) -->
    <div class="a5-lot-container">
      ${lotCardsHtml}
    </div>

    <!-- SUMMARY BAR -->
    <div class="a5-summary-bar">
      <span>TỔNG SỐ CÂY: ${totalRolls} CÂY</span>
      <span>TỔNG KHỐI LƯỢNG XUẤT: ${escapeHtml(totalSummary)}</span>
    </div>

    <!-- CHỮ KÝ 4 BÊN -->
    <div class="a5-signatures">
      <div class="a5-sign-box">
        <div class="a5-sign-role">Người lập phiếu</div>
        <div class="a5-sign-desc">(Ký, họ tên)</div>
      </div>
      <div class="a5-sign-box">
        <div class="a5-sign-role">Người vận chuyển</div>
        <div class="a5-sign-desc">(Ký, họ tên)</div>
      </div>
      <div class="a5-sign-box">
        <div class="a5-sign-role">Người nhận hàng</div>
        <div class="a5-sign-desc">(Ký, họ tên)</div>
      </div>
      <div class="a5-sign-box">
        <div class="a5-sign-role">Thủ kho xuất</div>
        <div class="a5-sign-desc">(Ký, họ tên)</div>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="a5-footer">
      <span>Vui lòng kiểm tra kỹ số lượng & chất lượng trước khi rời kho.</span>
      <span>In lúc: ${escapeHtml(generatedAt)}</span>
    </div>
  `;
}
