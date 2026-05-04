const HEADER_ALIASES: Record<string, string> = {
  'mã cuộn': 'roll_number',
  'ma cuon': 'roll_number',
  roll_number: 'roll_number',
  'cuộn mộc': 'raw_roll_number',
  'cuon moc': 'raw_roll_number',
  raw_roll_number: 'raw_roll_number',
  raw_roll: 'raw_roll_number',
  cân: 'weight_kg',
  can: 'weight_kg',
  'trọng lượng': 'weight_kg',
  'trong luong': 'weight_kg',
  weight_kg: 'weight_kg',
  weight: 'weight_kg',
  dài: 'length_m',
  dai: 'length_m',
  length_m: 'length_m',
  length: 'length_m',
  cl: 'quality_grade',
  'chất lượng': 'quality_grade',
  'chat luong': 'quality_grade',
  quality_grade: 'quality_grade',
  'ghi chú': 'notes',
  'ghi chu': 'notes',
  notes: 'notes',
};

function normalizeHeader(raw: string): string {
  const key = raw.trim().toLowerCase();
  return HEADER_ALIASES[key] ?? key;
}

export type ParsedRow = {
  roll_number?: string;
  raw_roll_number?: string;
  weight_kg?: number;
  length_m?: number;
  quality_grade?: string;
  notes?: string;
};

export async function parseExcelFile(file: File): Promise<ParsedRow[]> {
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws || ws.rowCount < 2) return [];

  const headerRow = ws.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber] = normalizeHeader(String(cell.value ?? ''));
  });

  const rows: ParsedRow[] = [];
  for (let i = 2; i <= ws.rowCount; i++) {
    const row = ws.getRow(i);
    const obj: Record<string, unknown> = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const h = headers[colNumber];
      if (h) obj[h] = cell.value;
    });
    if (!obj.roll_number && !obj.weight_kg) continue;
    rows.push({
      roll_number:
        obj.roll_number != null ? String(obj.roll_number).trim() : undefined,
      raw_roll_number:
        obj.raw_roll_number != null
          ? String(obj.raw_roll_number).trim()
          : undefined,
      weight_kg: obj.weight_kg != null ? Number(obj.weight_kg) : undefined,
      length_m: obj.length_m != null ? Number(obj.length_m) : undefined,
      quality_grade:
        obj.quality_grade != null
          ? String(obj.quality_grade).trim().toUpperCase()
          : undefined,
      notes: obj.notes != null ? String(obj.notes).trim() : undefined,
    });
  }
  return rows;
}

export function parseCsvText(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0]!.split(',').map(normalizeHeader);
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i]!.split(',');
    const obj: Record<string, string> = {};
    cells.forEach((c, idx) => {
      if (headers[idx]) obj[headers[idx]] = c.trim();
    });
    if (!obj.roll_number && !obj.weight_kg) continue;
    rows.push({
      roll_number: obj.roll_number || undefined,
      raw_roll_number: obj.raw_roll_number || undefined,
      weight_kg: obj.weight_kg ? Number(obj.weight_kg) : undefined,
      length_m: obj.length_m ? Number(obj.length_m) : undefined,
      quality_grade: obj.quality_grade?.toUpperCase() || undefined,
      notes: obj.notes || undefined,
    });
  }
  return rows;
}
