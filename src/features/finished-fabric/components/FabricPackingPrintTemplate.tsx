import React from 'react';

import type { FabricRollPackingItem } from '@/domain/inventory/packing-list.types';
import {
  calculatePackingSummary,
  groupRollsByColorAndBatch,
  normalizeGrade,
  roundWeight,
} from '@/domain/inventory/packing-list.utils';

export interface FabricPackingPrintTemplateProps {
  rolls: FabricRollPackingItem[];
  documentNumber?: string;
  customerName?: string;
  driverName?: string;
  licensePlate?: string;
  notes?: string;
}

export const FabricPackingPrintTemplate: React.FC<
  FabricPackingPrintTemplateProps
> = ({
  rolls,
  documentNumber = 'PKL-2026-001',
  customerName = 'Công ty TNHH May Mặc Đối Tác',
  driverName = 'Tài xế giao nhận',
  licensePlate = '51D-XXXXX',
  notes,
}) => {
  const summary = calculatePackingSummary(rolls);
  const groups = groupRollsByColorAndBatch(rolls);

  return (
    <div className="p-8 bg-surface text-foreground font-sans text-xs max-w-4xl mx-auto print:p-0 print:max-w-none">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-border pb-4 mb-4">
        <div>
          <h1 className="text-sm font-extrabold uppercase text-foreground">
            CÔNG TY TNHH SX TM DỆT MAY VĨNH PHÁT
          </h1>
          <p className="text-[11px] text-muted mt-0.5">
            Xưởng Dệt Nhuộm & Hoàn Tất Vải — Hotline: 0903.XXX.XXX
          </p>
        </div>
        <div className="text-right">
          <div className="text-base font-black tracking-wide text-primary">
            BẢNG KÊ CÂY VẢI
          </div>
          <div className="text-[11px] text-muted mt-0.5">
            Số: <strong>{documentNumber}</strong>
          </div>
          <div className="text-[11px] text-muted">
            Ngày: {new Date().toLocaleDateString('vi-VN')}
          </div>
        </div>
      </div>

      {/* Meta Information */}
      <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-lg border border-border bg-surface-secondary/40 text-[11px]">
        <div>
          <p>
            <span className="text-muted">Đơn vị nhận hàng:</span>{' '}
            <strong className="text-foreground">{customerName}</strong>
          </p>
          <p className="mt-1">
            <span className="text-muted">Phương tiện vận chuyển:</span>{' '}
            <strong className="text-foreground">{licensePlate}</strong> (Tài xế:{' '}
            {driverName})
          </p>
        </div>
        <div className="text-right">
          <p>
            <span className="text-muted">Tổng số lượng xuất:</span>{' '}
            <strong className="text-foreground">{summary.total_rolls}</strong>{' '}
            cây ({summary.total_weight_kg} kg)
          </p>
          {notes && <p className="mt-1 text-muted italic">Ghi chú: {notes}</p>}
        </div>
      </div>

      {/* Grouped Table */}
      <div className="flex flex-col gap-4 mb-6">
        {groups.map((group) => (
          <div key={group.group_key}>
            <div className="flex justify-between items-center bg-surface-secondary px-3 py-1.5 font-bold text-[11px] border border-border border-b-0">
              <span>
                Mặt hàng: {group.fabric_type || 'Vải thành phẩm'} — Màu:{' '}
                {group.color_name}{' '}
                {group.lot_number ? `(Lô: ${group.lot_number})` : ''}
              </span>
              <span>
                {group.total_rolls} cây • {group.total_weight_kg} kg • TB:{' '}
                {group.average_weight_kg} kg/cây
              </span>
            </div>

            <table className="w-full border-collapse border border-border text-[11px]">
              <thead>
                <tr className="bg-surface-secondary/30 text-muted font-bold text-center">
                  <th className="border border-border py-1 px-2 w-10">STT</th>
                  <th className="border border-border py-1 px-2 text-left">
                    Mã cây vải
                  </th>
                  <th className="border border-border py-1 px-2">Khổ vải</th>
                  <th className="border border-border py-1 px-2 text-right">
                    Cân nặng (kg)
                  </th>
                  <th className="border border-border py-1 px-2">Phẩm cấp</th>
                  <th className="border border-border py-1 px-2">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {group.rolls.map((roll, idx) => (
                  <tr key={roll.id || roll.roll_code} className="text-center">
                    <td className="border border-border py-1 px-2 text-muted">
                      {roll.roll_sequence || idx + 1}
                    </td>
                    <td className="border border-border py-1 px-2 text-left font-semibold">
                      {roll.roll_code}
                    </td>
                    <td className="border border-border py-1 px-2 text-muted">
                      {roll.width_inch ? `${roll.width_inch}"` : '—'}
                    </td>
                    <td className="border border-border py-1 px-2 text-right font-bold">
                      {roundWeight(roll.weight_kg).toFixed(1)}
                    </td>
                    <td className="border border-border py-1 px-2">
                      Loại {normalizeGrade(roll.grade)}
                    </td>
                    <td className="border border-border py-1 px-2 text-muted text-left">
                      {roll.notes || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Summary Total Box */}
      <div className="p-3 border border-border rounded-lg bg-surface-secondary/50 flex justify-between items-center text-xs font-bold mb-8">
        <span>TỔNG CỘNG TOÀN BỘ CHUYẾN HÀNG:</span>
        <span className="text-sm text-primary">
          {summary.total_rolls} cây vải — {summary.total_weight_kg} kg (TB:{' '}
          {summary.average_weight_kg} kg/cây)
        </span>
      </div>

      {/* Signature Section */}
      <div className="grid grid-cols-4 gap-4 text-center text-[11px] pt-4">
        <div>
          <p className="font-bold">Người lập bảng</p>
          <p className="text-[10px] text-muted italic mt-0.5">(Ký, họ tên)</p>
          <div className="h-16" />
        </div>
        <div>
          <p className="font-bold">Thủ kho xuất</p>
          <p className="text-[10px] text-muted italic mt-0.5">(Ký, họ tên)</p>
          <div className="h-16" />
        </div>
        <div>
          <p className="font-bold">Tài xế giao nhận</p>
          <p className="text-[10px] text-muted italic mt-0.5">(Ký, họ tên)</p>
          <div className="h-16" />
        </div>
        <div>
          <p className="font-bold">Đại diện khách hàng</p>
          <p className="text-[10px] text-muted italic mt-0.5">
            (Ký, nhận đủ cây)
          </p>
          <div className="h-16" />
        </div>
      </div>
    </div>
  );
};
