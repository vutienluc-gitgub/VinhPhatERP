/**
 * Print CSS Templates — Centralized print stylesheets.
 *
 * Each template is a raw CSS string injected into the print window.
 * Avoids inline CSS duplication across multiple print modals.
 */

/** Base print reset applied to ALL print windows */
export const BASE_PRINT_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
    padding: 20px;
    color: #1a1a1a;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @media print {
    body { padding: 0; }
  }
`;

/** Print CSS for yarn lot tags (QR & Barcode) */
export const LOT_TAG_CSS = `
  ${BASE_PRINT_CSS}
  .lot-card {
    page-break-inside: avoid;
    margin-bottom: 24px;
    border: 1px solid #ddd;
    padding: 16px;
    border-radius: 8px;
  }
  .lot-header {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 8px;
  }
  .lot-detail {
    font-size: 12px;
    color: #555;
    margin: 2px 0;
  }
  .qr-wrapper,
  .barcode-wrapper {
    text-align: center;
    margin: 12px 0;
    display: flex;
    justify-content: center;
  }
`;

/** Print CSS for fabric sample tags */
export const SAMPLE_TAG_CSS = `
  ${BASE_PRINT_CSS}
  .sample-tag {
    page-break-inside: avoid;
    border: 1px solid #ddd;
    padding: 16px;
    border-radius: 8px;
    width: 100%;
    max-width: 320px;
    margin: 0 auto;
    text-align: center;
  }
  .tag-header {
    font-weight: 700;
    font-size: 18px;
    margin-bottom: 4px;
  }
  .tag-code {
    font-weight: 600;
    font-size: 16px;
    color: #4338ca;
    margin-bottom: 12px;
  }
  .tag-detail {
    font-size: 13px;
    color: #555;
    margin: 4px 0;
    text-align: left;
  }
  .qr-wrapper {
    margin: 16px 0;
    display: flex;
    justify-content: center;
  }
`;

/** Print CSS for fabric sample horizontal tags (80mm x 40mm) */
export const FABRIC_SAMPLE_HORIZONTAL_CSS = `
  @page {
    size: 80mm 40mm;
    margin: 0;
  }
  html, body {
    width: 80mm;
    min-height: 40mm;
    margin: 0;
    padding: 0;
    overflow: hidden;
    font-family: Arial, sans-serif;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .label {
    width: 80mm;
    height: 40mm;
    box-sizing: border-box;
    padding: 2mm;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .label-left {
    width: 28mm;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .label-left svg,
  .label-left canvas,
  .label-left img {
    width: 100% !important;
    height: 100% !important;
    max-width: 25mm;
    max-height: 25mm;
    object-fit: contain;
    display: block;
  }
  .label-right {
    flex: 1;
    padding-left: 3mm;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
  }
  .code {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 2mm;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .name {
    font-size: 11px;
    line-height: 1.2;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    text-overflow: ellipsis;
    word-break: break-word;
  }
  .domain {
    font-size: 8px;
    margin-top: 3mm;
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

/** Print CSS for AST-based Labels (Renders full SVG) */
export const AST_LABEL_CSS = `
  @page {
    margin: 0;
  }
  html, body {
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100vw;
    height: 100vh;
  }
  .ast-label-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .ast-label-wrapper svg {
    width: 100% !important;
    height: 100% !important;
    object-fit: contain;
  }
`;
