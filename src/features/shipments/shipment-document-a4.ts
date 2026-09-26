import type { ShipmentDocument } from '@/domain/shipments/types';
import { SHIPMENT_DOCUMENT_LABELS } from '@/features/shipments/shipment-document.constants';
import {
  escapeHtml,
  formatText,
  formatDate,
  type DocumentPage,
} from '@/features/shipments/shipment-document.utils';

export interface RenderA4Params {
  page: DocumentPage;
  isA5: boolean;
  showLogo: boolean;
  logoSrc: string;
  companyName: string;
  shipment: ShipmentDocument;
  orderNumber?: string;
  customerName: string;
  customerCode: string;
  customerContact: string;
  customerPhone: string;
  deliveryAddress: string;
  totalRolls: number;
  totalSummary: string;
  createdByName: string;
  showQr: boolean;
  qrDataUrl: string;
  verifyUrl: string;
  footerText: string;
  generatedAt: string;
}

export function renderA4PageHtml(params: RenderA4Params): string {
  const {
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
  } = params;

  // Grouped table rows
  const tableRowsHtml =
    page.groups.length > 0
      ? page.groups
          .map((group) => {
            const rollsDisplay =
              isA5 && group.rolls.length > 4
                ? `<b>${group.rolls.length} cây</b> (${escapeHtml(group.rolls[0]?.number ?? '')} ~ ${escapeHtml(group.rolls[group.rolls.length - 1]?.number ?? '')})`
                : group.rolls
                    .map(
                      (r) =>
                        `<span class="roll-pill">${escapeHtml(r.number)}<span class="roll-qty">${escapeHtml(r.quantityText)}</span></span>`,
                    )
                    .join('');

            return `
            <tr>
              <td class="text-center idx-cell">${group.index}</td>
              <td>${escapeHtml(group.fabricType)}</td>
              <td>${escapeHtml(group.colorName)}</td>
              <td><div class="roll-pills">${rollsDisplay}</div></td>
              <td class="text-right font-bold">${escapeHtml(group.totalQuantityText)}</td>
              <td>${escapeHtml(group.note)}</td>
            </tr>`;
          })
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
          <div class="brand-block">
            ${showLogo ? `<img src="${escapeHtml(logoSrc)}" alt="Logo" class="brand-logo" />` : ''}
            <div class="brand">
              <div class="brand-name">${escapeHtml(companyName)}</div>
              <div class="doc-title">${SHIPMENT_DOCUMENT_LABELS.DOCUMENT_TITLE}</div>
              <div class="doc-subtitle">${docSubtitleHtml}</div>
            </div>
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
              <span class="meta-value">${escapeHtml(orderNumber ?? '')}</span>
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
                <span class="info-key">${SHIPMENT_DOCUMENT_LABELS.CUSTOMER_CODE}:</span>
                <span class="info-val">${escapeHtml(customerCode)}</span>
              </div>
              <div class="info-row">
                <span class="info-key">${SHIPMENT_DOCUMENT_LABELS.CONTACT_PERSON}:</span>
                <span class="info-val">${escapeHtml(customerContact)}</span>
              </div>
              <div class="info-row">
                <span class="info-key">${SHIPMENT_DOCUMENT_LABELS.PHONE}:</span>
                <span class="info-val">${escapeHtml(customerPhone)}</span>
              </div>
            </div>
          </div>
          <div class="info-card">
            <div class="info-card-header">${SHIPMENT_DOCUMENT_LABELS.DELIVERY_INFO}</div>
            <div class="info-card-body">
              <div class="info-row">
                <span class="info-key">${SHIPMENT_DOCUMENT_LABELS.DELIVERY_ADDRESS}:</span>
                <span class="info-val">${escapeHtml(deliveryAddress)}</span>
              </div>
              <div class="info-row">
                <span class="info-key">${SHIPMENT_DOCUMENT_LABELS.STATUS}:</span>
                <span class="info-val">${escapeHtml(formatText(shipment.status))}</span>
              </div>
              <div class="info-row">
                <span class="info-key">${SHIPMENT_DOCUMENT_LABELS.NOTES}:</span>
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
            ${
              showQr
                ? `
            <div class="qr-block">
              <img src="${qrDataUrl}" alt="QR verify" />
              <div class="qr-label">${SHIPMENT_DOCUMENT_LABELS.QR_VERIFY}</div>
              <div class="qr-url">${escapeHtml(verifyUrl)}</div>
            </div>`
                : ''
            }
          </div>
        </div>
        `
            : ''
        }

        <!-- FOOTER -->
        <div class="doc-footer">
          <span>${escapeHtml(companyName)} — ${escapeHtml(footerText)}</span>
          <span>${SHIPMENT_DOCUMENT_LABELS.PRINTED_AT}: ${escapeHtml(generatedAt)}</span>
        </div>
      `;
}
