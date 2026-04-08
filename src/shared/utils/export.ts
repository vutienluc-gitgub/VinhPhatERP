/**
 * Shared export utilities — Excel (xlsx) và PDF (jspdf + autotable).
 * Dùng chung cho tất cả feature cần xuất dữ liệu.
 * Libs được lazy-import để giảm bundle size ban đầu (~400KB).
 */

export type ExportColumn = {
  /** Header hiển thị trong file */
  label: string;
  /** Key trong object dữ liệu */
  key: string;
  /** Căn lề cell Excel (default: left) */
  align?: 'left' | 'right' | 'center';
  /** Chiều rộng cột Excel tính bằng ký tự (default: auto) */
  width?: number;
};

/** Xuất mảng data ra file Excel (.xlsx) */
export async function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  options: {
    fileName: string;
    sheetName?: string;
    title?: string;
  },
): Promise<void> {
  const [{ default: ExcelJS }, { saveAs }] = await Promise.all([
    import('exceljs'),
    import('file-saver'),
  ]);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(options.sheetName ?? 'Sheet1');

  // Thiết lập cột
  ws.columns = columns.map((c) => ({
    header: c.label,
    key: c.key,
    width: c.width ?? Math.max(c.label.length + 2, 12),
  }));

  // Bold header row
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true };

  // Các hàng dữ liệu
  for (const row of data) {
    const rowValues: Record<string, unknown> = {};
    for (const c of columns) {
      const val = row[c.key];
      rowValues[c.key] = val === null || val === undefined ? '' : val;
    }
    ws.addRow(rowValues);
  }

  const safeFileName = options.fileName.endsWith('.xlsx')
    ? options.fileName
    : `${options.fileName}.xlsx`;

  const buffer = await wb.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    safeFileName,
  );
}

/** Xuất mảng data ra file PDF — dùng browser print dialog để hỗ trợ tiếng Việt */
export function exportToPdf<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  options: {
    fileName: string;
    title: string;
    subtitle?: string;
  },
): void {
  const generatedAt = new Date().toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const headerCells = columns.map((c) => `<th>${c.label}</th>`).join('');
  const bodyRows = data
    .map((row) => {
      const cells = columns
        .map((c) => {
          const val = row[c.key];
          const text = val === null || val === undefined ? '—' : String(val);
          const align = c.align ?? 'left';
          return `<td style="text-align:${align}">${text}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>${options.fileName}</title>
<style>
  @page { size: A4 landscape; margin: 16mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, "Helvetica Neue", sans-serif; font-size: 9pt; color: #111; margin: 0; }
  h1 { font-size: 13pt; font-weight: 700; margin: 0 0 4px; }
  .sub { font-size: 9pt; color: #333; margin: 0 0 2px; }
  .meta { font-size: 7.5pt; color: #888; margin: 0 0 10px; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #0b6bcb; color: #fff; }
  th { font-size: 7.5pt; font-weight: 700; padding: 4px 5px; text-align: left; border: 1px solid #0b6bcb; }
  td { font-size: 8pt; padding: 3.5px 5px; border: 1px solid #d0dae8; }
  tbody tr:nth-child(even) { background: #f5f8fc; }
  .footer { margin-top: 8px; font-size: 7pt; color: #aaa; text-align: right; }
</style>
</head>
<body>
<h1>${options.title}</h1>
${options.subtitle ? `<p class="sub">${options.subtitle}</p>` : ''}
<p class="meta">Xuất lúc: ${generatedAt}</p>
<table>
  <thead><tr>${headerCells}</tr></thead>
  <tbody>${bodyRows}</tbody>
</table>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.addEventListener('load', () => {
    win.focus();
    win.print();
  });
}
