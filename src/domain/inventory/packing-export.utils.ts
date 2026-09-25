/**
 * Export and tabular formatting utilities for Fabric Roll Packing List.
 * Pure TypeScript — zero dependencies on UI.
 */

import type {
  FabricRollPackingItem,
  PackingListExportRow,
} from '@/domain/inventory/packing-list.types';
import {
  calculatePackingSummary,
  normalizeGrade,
  roundWeight,
} from '@/domain/inventory/packing-list.utils';

/**
 * Formats roll records for tabular display and export.
 */
export function formatPackingListForExport(
  rolls: FabricRollPackingItem[],
): PackingListExportRow[] {
  return rolls.map((roll, index) => ({
    stt: roll.roll_sequence || index + 1,
    ma_cay_vai: roll.roll_code,
    loai_vai: roll.fabric_type || 'N/A',
    mau: roll.color_name || 'N/A',
    lo_nhuom: roll.lot_number || 'N/A',
    kho_vai_inch: roll.width_inch ? `${roll.width_inch}"` : 'N/A',
    chieu_dai_m: roll.length_meters ? `${roll.length_meters}m` : 'N/A',
    can_nang_kg: roundWeight(roll.weight_kg).toFixed(1),
    pham_cap: `Loại ${normalizeGrade(roll.grade)}`,
    trang_thai_kiem_dem: roll.checked ? 'Đã kiểm đếm' : 'Chưa kiểm',
    ghi_chu: roll.notes || '',
  }));
}

/**
 * Generates UTF-8 with BOM CSV content suitable for opening in Microsoft Excel.
 */
export function exportPackingListToCsvContent(
  rolls: FabricRollPackingItem[],
  headerTitle: string = 'BẢNG KÊ DANH SÁCH CÂY VẢI - DỆT MAY VĨNH PHÁT',
): string {
  const rows = formatPackingListForExport(rolls);
  const summary = calculatePackingSummary(rolls);

  const headers = [
    'STT',
    'Mã Cây Vải',
    'Loại Vải',
    'Màu Sắc',
    'Lô Nhuộm',
    'Khổ Vải',
    'Chiều Dài',
    'Khối Lượng (kg)',
    'Phẩm Cấp',
    'Kiểm Đếm',
    'Ghi Chú',
  ];

  const csvLines: string[] = [];
  csvLines.push(`"${headerTitle}"`);
  csvLines.push(`"Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}"`);
  csvLines.push(
    `"Tổng số cây: ${summary.total_rolls} | Tổng khối lượng: ${summary.total_weight_kg} kg | Trung bình: ${summary.average_weight_kg} kg/cây"`,
  );
  csvLines.push('');
  csvLines.push(headers.map((h) => `"${h}"`).join(','));

  for (const r of rows) {
    csvLines.push(
      [
        r.stt,
        `"${r.ma_cay_vai}"`,
        `"${r.loai_vai}"`,
        `"${r.mau}"`,
        `"${r.lo_nhuom}"`,
        `"${r.kho_vai_inch}"`,
        `"${r.chieu_dai_m}"`,
        r.can_nang_kg,
        `"${r.pham_cap}"`,
        `"${r.trang_thai_kiem_dem}"`,
        `"${r.ghi_chu}"`,
      ].join(','),
    );
  }

  // UTF-8 BOM prefix (\uFEFF) for Vietnamese characters in Excel
  return `\uFEFF${csvLines.join('\r\n')}`;
}
