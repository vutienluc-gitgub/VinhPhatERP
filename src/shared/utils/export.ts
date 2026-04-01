/**
 * Shared export utilities — Excel (xlsx) và PDF (jspdf + autotable).
 * Dùng chung cho tất cả feature cần xuất dữ liệu.
 * Libs được lazy-import để giảm bundle size ban đầu (~400KB).
 */

export type ExportColumn = {
  /** Header hiển thị trong file */
  label: string
  /** Key trong object dữ liệu */
  key: string
  /** Căn lề cell Excel (default: left) */
  align?: 'left' | 'right' | 'center'
  /** Chiều rộng cột Excel tính bằng ký tự (default: auto) */
  width?: number
}

/** Xuất mảng data ra file Excel (.xlsx) */
export async function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  options: {
    fileName: string
    sheetName?: string
    title?: string
  },
): Promise<void> {
  const [{ default: ExcelJS }, { saveAs }] = await Promise.all([
    import('exceljs'),
    import('file-saver'),
  ])
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(options.sheetName ?? 'Sheet1')

  // Thiết lập cột
  ws.columns = columns.map((c) => ({
    header: c.label,
    key: c.key,
    width: c.width ?? Math.max(c.label.length + 2, 12),
  }))

  // Bold header row
  const headerRow = ws.getRow(1)
  headerRow.font = { bold: true }

  // Các hàng dữ liệu
  for (const row of data) {
    const rowValues: Record<string, unknown> = {}
    for (const c of columns) {
      const val = row[c.key]
      rowValues[c.key] = val === null || val === undefined ? '' : val
    }
    ws.addRow(rowValues)
  }

  const safeFileName = options.fileName.endsWith('.xlsx')
    ? options.fileName
    : `${options.fileName}.xlsx`

  const buffer = await wb.xlsx.writeBuffer()
  saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), safeFileName)
}

/** Xuất mảng data ra file PDF (A4 landscape) */
export async function exportToPdf<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  options: {
    fileName: string
    title: string
    subtitle?: string
  },
): Promise<void> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const generatedAt = new Date().toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // Tiêu đề
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(options.title, 14, 16)

  if (options.subtitle) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(options.subtitle, 14, 22)
  }

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120)
  doc.text(`Xuất lúc: ${generatedAt}`, 14, options.subtitle ? 28 : 22)
  doc.setTextColor(0)

  const tableHead = [columns.map((c) => c.label)]
  const tableBody = data.map((row) =>
    columns.map((c) => {
      const val = row[c.key]
      return val === null || val === undefined ? '—' : String(val)
    }),
  )

  autoTable(doc, {
    head: tableHead,
    body: tableBody,
    startY: options.subtitle ? 32 : 26,
    styles: { fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
    headStyles: {
      fillColor: [11, 107, 203],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    alternateRowStyles: { fillColor: [245, 248, 252] },
    columnStyles: columns.reduce<Record<number, { halign: 'left' | 'right' | 'center' }>>(
      (acc, col, idx) => {
        if (col.align && col.align !== 'left') {
          acc[idx] = { halign: col.align }
        }
        return acc
      },
      {},
    ),
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages()
      doc.setFontSize(7)
      doc.setTextColor(150)
      doc.text(
        `Trang ${data.pageNumber} / ${pageCount}`,
        doc.internal.pageSize.getWidth() - 30,
        doc.internal.pageSize.getHeight() - 8,
      )
      doc.setTextColor(0)
    },
  })

  const safeFileName = options.fileName.endsWith('.pdf')
    ? options.fileName
    : `${options.fileName}.pdf`

  doc.save(safeFileName)
}
