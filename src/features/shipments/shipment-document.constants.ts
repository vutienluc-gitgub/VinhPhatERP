export const SHIPMENT_DOCUMENT_LABELS = {
  EMPTY_VALUE: '—',
  NO_ITEMS: 'Không có dòng hàng.',
  DOCUMENT_TITLE: 'Phiếu xuất kho',
  DOCUMENT_SUBTITLE: 'Chứng từ giao hàng & xuất kho thành phẩm',
  DOC_NUMBER: 'Số phiếu',
  DELIVERY_DATE: 'Ngày giao',
  ORDER: 'Đơn hàng',
  PRINTED_AT: 'In lúc',
  CUSTOMER_INFO: 'Thông tin khách hàng',
  CUSTOMER_CODE: 'Mã khách',
  CONTACT_PERSON: 'Người liên hệ',
  PHONE: 'Số điện thoại',
  DELIVERY_INFO: 'Thông tin giao hàng',
  DELIVERY_ADDRESS: 'Địa chỉ giao',
  STATUS: 'Trạng thái',
  NOTES: 'Ghi chú',
  TABLE_INDEX: 'STT',
  TABLE_FABRIC: 'Loại vải',
  TABLE_COLOR: 'Màu',
  TABLE_ROLL_CODE: 'Mã cuộn',
  TABLE_TOTAL_QTY: 'Tổng SL',
  TOTAL_ROLLS: 'Số cuộn:',
  TOTAL_QTY: 'Tổng số lượng:',
  SIGN_CREATOR: 'Người lập phiếu',
  SIGN_STOREKEEPER: 'Thủ kho',
  SIGN_RECEIVER: 'Người nhận hàng',
  SIGN_INSTRUCTION: 'Ký và ghi rõ họ tên',
  QR_VERIFY: 'Quét để xác minh',
  FOOTER_DISCLAIMER:
    'Vui lòng kiểm tra kỹ số lượng và chất lượng trước khi rời kho.',
  COPY_1_LABEL: 'Liên 1: Bản lưu kho',
  COPY_2_LABEL: 'Liên 2: Bản khách hàng',
  PAGE_LABEL: 'Trang',
};

export const SHIPMENT_DOCUMENT_ERRORS = {
  NOT_BROWSER_ENV: 'Không thể in PDF ngoài môi trường trình duyệt.',
  CANNOT_OPEN_PRINTER: 'Không thể mở trình in PDF trong trình duyệt này.',
};

export const PRINT_CLEANUP_DELAY_MS = 1000;

export const VERIFY_BASE_URL = 'https://quantri.detmayvinhphat.com/verify';

export const SHIPMENT_DOCUMENT_CSS = `
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
  .brand-block {
    display: flex;
    align-items: center;
    gap: 4mm;
  }
  .brand-logo {
    width: 48px;
    height: 48px;
    object-fit: contain;
    flex-shrink: 0;
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
`;

export const SHIPMENT_DOCUMENT_A5_DOT_MATRIX_CSS = `
  @page {
    size: 200mm 140mm;
    margin: 0;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    color: #000;
    font-family: Arial, "Segoe UI", sans-serif;
    font-size: 7.5pt;
    line-height: 1.2;
    background: #fff;
    margin: 0;
    padding: 0;
  }

  @media print {
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      height: 140mm !important;
      max-height: 140mm !important;
      overflow: hidden !important;
    }
    .page, .a5-page {
      page-break-after: avoid !important;
      page-break-inside: avoid !important;
      break-after: avoid !important;
      break-inside: avoid !important;
    }
  }

  .accent-bar { display: none; }

  /* ── A5 Page wrapper for continuous printing (200mm x 140mm, margin 0mm, safe padding 2mm) ── */
  .a5-page {
    height: 140mm;
    max-height: 140mm;
    width: 200mm;
    overflow: hidden;
    padding: 2mm 3.5mm;
    margin: 0;
    page-break-after: avoid !important;
    page-break-inside: avoid !important;
    break-after: avoid !important;
    break-inside: avoid !important;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .page { display: contents; }

  /* ── Header tinh gọn (3 cột) ── */
  .a5-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1.5px solid #000;
    padding-bottom: 1mm;
    margin-bottom: 1.2mm;
  }
  .a5-header-left {
    flex: 1.3;
    display: flex;
    align-items: center;
    gap: 2mm;
  }
  .a5-brand-logo {
    width: 8mm;
    height: 8mm;
    object-fit: contain;
    flex-shrink: 0;
  }
  .a5-comp-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
  }
  .a5-comp-name {
    font-size: 8.5pt;
    font-weight: 800;
    text-transform: uppercase;
    line-height: 1.15;
  }
  .a5-comp-sub {
    font-size: 7.5pt;
    color: #222;
    margin-top: 0.3mm;
    line-height: 1.15;
  }
  .a5-comp-meta {
    font-size: 7.5pt;
    color: #333;
    line-height: 1.15;
  }
  .a5-header-center {
    flex: 1.1;
    text-align: center;
  }
  .a5-doc-title { font-size: 12pt; font-weight: 900; letter-spacing: 0.04em; text-transform: uppercase; }
  .a5-doc-sub { font-size: 7.5pt; font-weight: bold; color: #111; }
  .a5-header-right { flex: 0.8; text-align: right; font-size: 7.5pt; line-height: 1.3; }
  .a5-doc-no { font-size: 9pt; font-weight: 800; }

  /* ── Info bar 2 cột (bỏ khung viền tăng tốc in kim) ── */
  .a5-info-bar {
    display: flex;
    justify-content: space-between;
    border: none;
    padding: 0.5mm 0;
    margin-bottom: 1.5mm;
    font-size: 7.5pt;
    line-height: 1.35;
    background: transparent;
  }
  .a5-info-col { flex: 1; }

  /* ── Lot Matrix Card (Lược bỏ toàn bộ viền ô để đầu kim in lướt nhanh) ── */
  .a5-lot-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.5mm;
    overflow: hidden;
  }
  .a5-lot-card { border: none; background: transparent; }
  .a5-lot-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: transparent;
    border: none;
    padding: 0.4mm 0;
    font-size: 8pt;
  }
  .a5-fabric-name { font-size: 8.5pt; font-weight: 800; text-transform: uppercase; }
  .a5-color-badge { margin-left: 2mm; padding: 0; border: none; font-size: 7.5pt; font-weight: bold; }
  .a5-lot-stats { font-size: 8pt; font-weight: bold; }

  .a5-roll-matrix {
    display: grid;
    grid-template-columns: repeat(15, 1fr);
    gap: 0.6mm;
    padding: 0.6mm 0;
  }
  .a5-matrix-cell { border: none; text-align: left; padding: 0.3mm 0; background: transparent; line-height: 1.1; }
  .a5-roll-idx { display: block; font-family: Arial, "Segoe UI", sans-serif; font-size: 7.5pt; color: #000; text-align: left; }
  .a5-roll-val { display: block; font-size: 8.5pt; font-weight: 800; color: #000; text-align: left; }

  /* ── Summary bar (hoàn toàn không đường kẻ để in kim nhanh tối đa) ── */
  .a5-summary-bar {
    display: flex;
    justify-content: space-between;
    border: none;
    padding: 1mm 0;
    font-size: 8.5pt;
    font-weight: 800;
    margin-top: 1.5mm;
    margin-bottom: 1.5mm;
    background: transparent;
  }

  /* ── Signatures 4 bên (thoáng, không kẻ khung) ── */
  .a5-signatures { display: grid; grid-template-columns: repeat(4, 1fr); border: none; height: 16mm; }
  .a5-sign-box { border: none; text-align: center; padding: 0.8mm; }
  .a5-sign-box:last-child { border: none; }
  .a5-sign-role { font-size: 8pt; font-weight: 800; text-transform: uppercase; }
  .a5-sign-desc { font-family: Arial, "Segoe UI", sans-serif; font-size: 7.5pt; color: #000; margin-top: 0.4mm; }

  /* ── Footer ── */
  .a5-footer {
    display: flex;
    justify-content: space-between;
    border: none;
    padding-top: 0.4mm;
    margin-top: 0.8mm;
    font-family: Arial, "Segoe UI", sans-serif;
    font-size: 7.5pt;
    color: #000;
  }

  /* Legacy fallback */
  .qr-block { display: none; }
`;
