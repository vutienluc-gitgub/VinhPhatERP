import React from 'react';

import type { FabricRollPackingItem } from '@/domain/inventory/packing-list.types';
import {
  calculatePackingSummary,
  groupRollsByColorAndBatch,
} from '@/domain/inventory/packing-list.utils';
import { FabricRollMatrixTable } from '@/shared/components/fabric-roll/FabricRollMatrixTable';

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
    <div className="p-4 bg-surface text-foreground font-sans text-xs max-w-[210mm] mx-auto print:p-0 print:max-w-none print:w-full print:bg-white print:text-black">
      <style>{`
        @media print {
          @page {
            size: A5 landscape;
            margin: 6mm 8mm;
          }
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-start border-b border-border pb-2 mb-2">
        <div>
          <h1 className="text-xs font-black uppercase text-foreground">
            CÔNG TY TNHH SX TM DỆT MAY VĨNH PHÁT
          </h1>
          <p className="text-[10px] text-muted mt-0.5">
            Xưởng Dệt Nhuộm & Hoàn Tất Vải — Bảng kê cây vải xuất xưởng
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm font-black tracking-wide text-primary">
            BẢNG KÊ CÂY VẢI (PACKING LIST)
          </div>
          <div className="text-[10px] text-muted mt-0.5">
            Số: <strong className="text-foreground">{documentNumber}</strong> —
            Ngày: {new Date().toLocaleDateString('vi-VN')}
          </div>
        </div>
      </div>

      {/* Meta Information */}
      <div className="grid grid-cols-2 gap-2 mb-2 p-2 rounded-lg border border-border bg-surface-secondary/40 text-[10.5px]">
        <div>
          <p>
            <span className="text-muted">Đơn vị nhận hàng:</span>{' '}
            <strong className="text-foreground">{customerName}</strong>
          </p>
          <p className="mt-0.5">
            <span className="text-muted">Phương tiện vận chuyển:</span>{' '}
            <strong className="text-foreground">{licensePlate}</strong> (Tài xế:{' '}
            {driverName})
          </p>
        </div>
        <div className="text-right">
          <p>
            <span className="text-muted">Tổng xuất:</span>{' '}
            <strong className="text-foreground">{summary.total_rolls}</strong>{' '}
            cây ({summary.total_weight_kg.toFixed(1)} kg)
          </p>
          {notes && (
            <p className="mt-0.5 text-muted italic">Ghi chú: {notes}</p>
          )}
        </div>
      </div>

      {/* Grouped Decade Matrix Table(s) */}
      <div className="flex flex-col gap-2.5 mb-3">
        {groups.map((group) => (
          <div key={group.group_key} className="flex flex-col gap-1">
            <div className="flex justify-between items-center bg-surface-secondary/60 px-2.5 py-1 font-bold text-[10.5px] border border-border rounded-t-md">
              <span>
                Mặt hàng: {group.fabric_type || 'Vải thành phẩm'} — Màu:{' '}
                {group.color_name}{' '}
                {group.lot_number ? `(Lô: ${group.lot_number})` : ''}
              </span>
              <span>
                {group.total_rolls} cây • {group.total_weight_kg.toFixed(1)} kg
                • TB: {group.average_weight_kg.toFixed(1)} kg/cây
              </span>
            </div>

            <FabricRollMatrixTable
              rolls={group.rolls}
              rollsPerRow={10}
              compact={true}
              showSubtotal={true}
              interactive={false}
              className="border-t-0 rounded-t-none"
            />
          </div>
        ))}
      </div>

      {/* Signature Section */}
      <div className="grid grid-cols-4 gap-2 text-center text-[10.5px] pt-1 border-t border-border/80">
        <div>
          <p className="font-bold">Người lập bảng</p>
          <p className="text-[9.5px] text-muted italic mt-0.5">(Ký, họ tên)</p>
          <div className="h-10" />
        </div>
        <div>
          <p className="font-bold">Thủ kho xuất</p>
          <p className="text-[9.5px] text-muted italic mt-0.5">(Ký, họ tên)</p>
          <div className="h-10" />
        </div>
        <div>
          <p className="font-bold">Tài xế giao nhận</p>
          <p className="text-[9.5px] text-muted italic mt-0.5">(Ký, họ tên)</p>
          <div className="h-10" />
        </div>
        <div>
          <p className="font-bold">Đại diện khách hàng</p>
          <p className="text-[9.5px] text-muted italic mt-0.5">
            (Ký, nhận đủ cây)
          </p>
          <div className="h-10" />
        </div>
      </div>
    </div>
  );
};
