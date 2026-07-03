import { EXPORT_COLORS } from '@/shared/constants/brand';

export interface RFQTicketData {
  leadId: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  companyName: string;
  requestType: string;
  date: string;
  items: {
    code: string;
    name: string;
    color: string;
    qty: number;
    unit: string;
  }[];
}

export function generateRFQTicketPdf(data: RFQTicketData): void {
  const generatedAt = data.date;

  const headerCells = `<th>Mã vải</th><th>Tên loại vải</th><th>Màu sắc</th><th>Số lượng</th><th>Đvt</th>`;
  const bodyRows = data.items
    .map(
      (row) =>
        `<tr>
          <td>${row.code}</td>
          <td>${row.name}</td>
          <td>${row.color}</td>
          <td style="text-align:right">${row.qty}</td>
          <td>${row.unit}</td>
        </tr>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>Phiếu Yêu Cầu Báo Giá - ${data.leadId}</title>
<style>
  @page { size: A5; margin: 16mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, "Helvetica Neue", sans-serif; font-size: 10pt; color: #111; margin: 0; }
  .header { text-align: center; margin-bottom: 20px; }
  .header h1 { font-size: 16pt; font-weight: 700; margin: 0 0 4px; color: ${EXPORT_COLORS.headerBg}; }
  .header p { font-size: 10pt; color: #666; margin: 0; }
  
  .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 20px; }
  .info-row { display: flex; margin-bottom: 6px; }
  .info-row:last-child { margin-bottom: 0; }
  .info-label { width: 100px; font-weight: 600; color: #475569; }
  .info-val { flex: 1; font-weight: 500; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  thead tr { background: ${EXPORT_COLORS.headerBg}; color: ${EXPORT_COLORS.headerText}; }
  th { font-size: 9pt; font-weight: 700; padding: 8px; text-align: left; border: 1px solid ${EXPORT_COLORS.headerBorder}; }
  td { font-size: 9pt; padding: 8px; border: 1px solid ${EXPORT_COLORS.cellBorder}; }
  tbody tr:nth-child(even) { background: ${EXPORT_COLORS.stripeBg}; }
  
  .footer { margin-top: 20px; font-size: 8pt; color: #888; text-align: center; border-top: 1px dashed #ccc; padding-top: 10px; }
</style>
</head>
<body>

<div class="header">
  <h1>VĨNH PHÁT TEXTILE</h1>
  <p>PHIẾU YÊU CẦU BÁO GIÁ (RFQ TICKET)</p>
</div>

<div class="info-box">
  <div class="info-row"><div class="info-label">Mã phiếu:</div><div class="info-val">${data.leadId}</div></div>
  <div class="info-row"><div class="info-label">Loại YC:</div><div class="info-val">${data.requestType}</div></div>
  <div class="info-row"><div class="info-label">Ngày tạo:</div><div class="info-val">${generatedAt}</div></div>
  <div class="info-row"><div class="info-label">Khách hàng:</div><div class="info-val">${data.contactName}</div></div>
  <div class="info-row"><div class="info-label">Điện thoại:</div><div class="info-val">${data.contactPhone}</div></div>
  ${data.companyName ? `<div class="info-row"><div class="info-label">Công ty:</div><div class="info-val">${data.companyName}</div></div>` : ''}
  ${data.contactEmail ? `<div class="info-row"><div class="info-label">Email:</div><div class="info-val">${data.contactEmail}</div></div>` : ''}
</div>

<table>
  <thead><tr>${headerCells}</tr></thead>
  <tbody>${bodyRows}</tbody>
</table>

<div class="footer">
  <p>Cảm ơn Quý khách đã quan tâm đến sản phẩm của Vĩnh Phát Textile.</p>
  <p>Đội ngũ Sales sẽ liên hệ với Quý khách trong thời gian sớm nhất.</p>
</div>

</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) {
    console.warn('Popup blocked, cannot open PDF print dialog.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.addEventListener('load', () => {
    win.focus();
    win.print();
  });
}
