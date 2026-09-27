import { Blob as NodeBlob } from 'node:buffer';

import { saveAs } from 'file-saver';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import type { FabricRollPackingItem } from '@/domain/inventory/packing-list.types';
import { exportPackingListToExcel } from '@/shared/services/print/packing-list/packing-list-excel';

vi.mock('file-saver', () => ({ saveAs: vi.fn(), default: vi.fn() }));

const mockRolls: FabricRollPackingItem[] = [
  {
    id: 'roll-1',
    roll_code: 'VP-MT-01',
    roll_sequence: 1,
    weight_kg: 22.8,
    fabric_type: 'Vảy cá',
    color_name: 'Muối Tiêu',
    lot_number: 'L01',
    width_inch: 63,
    length_meters: 50,
    grade: 'A',
    checked: true,
  },
  {
    id: 'roll-2',
    roll_code: 'VP-MT-02',
    roll_sequence: 2,
    weight_kg: 23.4,
    fabric_type: 'Vảy cá',
    color_name: 'Muối Tiêu',
    lot_number: 'L01',
    grade: 'B',
    checked: false,
  },
];

async function capturedBlob(): Promise<Blob> {
  const [blob] = vi.mocked(saveAs).mock.calls[0]!;
  return blob as Blob;
}

// jsdom's Blob lacks arrayBuffer(); Node's Blob (stubbed below) provides it.
// Buffer keeps the data in the Node realm so jszip's instanceof checks pass.
async function blobToBuffer(blob: Blob): Promise<Buffer> {
  return Buffer.from(await blob.arrayBuffer());
}

describe('exportPackingListToExcel', () => {
  beforeAll(() => {
    vi.stubGlobal('Blob', NodeBlob);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('builds a real xlsx workbook and saves it', async () => {
    await exportPackingListToExcel(mockRolls, { fileName: 'bang_ke_test' });

    expect(saveAs).toHaveBeenCalledTimes(1);
    const [blob, fileName] = vi.mocked(saveAs).mock.calls[0]!;
    expect(fileName).toBe('bang_ke_test.xlsx');
    expect(blob).toBeInstanceOf(Blob);
    expect((blob as Blob).type).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect((blob as Blob).size).toBeGreaterThan(0);
  });

  it('re-opens the saved workbook with real ExcelJS and keeps roll values + numeric weight', async () => {
    await exportPackingListToExcel(mockRolls, {
      fileName: 'bang_ke_readback',
      sheetName: 'Bảng kê cây vải',
    });

    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    const buffer = await blobToBuffer(await capturedBlob());
    await wb.xlsx.load(buffer as unknown as Parameters<typeof wb.xlsx.load>[0]);

    const ws = wb.getWorksheet('Bảng kê cây vải');
    expect(ws).toBeDefined();
    const header = (ws!.getRow(1).values as unknown[]).slice(1);
    expect(header).toContain('Mã Cây Vải');
    expect(header).toContain('Khối Lượng (kg)');

    const weightCol = header.indexOf('Khối Lượng (kg)') + 1;
    const codeCol = header.indexOf('Mã Cây Vải') + 1;
    expect(ws!.getRow(2).getCell(codeCol).value).toBe('VP-MT-01');
    expect(ws!.getRow(2).getCell(weightCol).value).toBe(22.8);

    const total = [2, 3]
      .map((r) => ws!.getRow(r).getCell(weightCol).value)
      .reduce<number>((sum, v) => sum + Number(v), 0);
    expect(total).toBeCloseTo(46.2, 3);
  });

  it('derives a readable file name from the title when none is given', async () => {
    await exportPackingListToExcel(mockRolls, { title: 'Bảng kê ca 1' });

    const [, fileName] = vi.mocked(saveAs).mock.calls[0]!;
    expect(fileName).toMatch(/^bang_ke_ca_1_\d{8}_\d{4}\.xlsx$/);
  });

  it('falls back to the default prefix for an unaccent-only empty title', async () => {
    await exportPackingListToExcel(mockRolls, { title: '---' });

    const [, fileName] = vi.mocked(saveAs).mock.calls[0]!;
    expect(fileName).toMatch(/^bang_ke_cay_vai_\d{8}_\d{4}\.xlsx$/);
  });
});
