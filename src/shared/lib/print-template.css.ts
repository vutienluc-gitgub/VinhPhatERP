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
