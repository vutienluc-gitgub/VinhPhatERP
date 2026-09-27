import type { FabricRollPackingItem } from '@/domain/inventory/packing-list.types';
import {
  calculatePackingSummary,
  groupRollsByColorAndBatch,
} from '@/domain/inventory/packing-list.utils';
import { FabricRollMatrixTable } from '@/shared/components/fabric-roll/FabricRollMatrixTable';

export interface PackingRollsPreviewMeta {
  customerName?: string;
  licensePlate?: string;
  driverName?: string;
  notes?: string;
}

export interface PackingRollsPreviewProps {
  rolls: FabricRollPackingItem[];
  meta?: PackingRollsPreviewMeta;
}

/** Matrix preview of packing-list rolls, shared by the print dialog. */
export function PackingRollsPreview({ rolls, meta }: PackingRollsPreviewProps) {
  const summary = calculatePackingSummary(rolls);
  const groups = groupRollsByColorAndBatch(rolls);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-1.5 text-[11px] border border-default rounded p-2">
        <p>
          Đơn vị nhận hàng:{' '}
          <strong className="text-foreground">
            {meta?.customerName || '—'}
          </strong>
        </p>
        <p>
          Phương tiện:{' '}
          <strong className="text-foreground">
            {meta?.licensePlate || '—'}
          </strong>{' '}
          (Tài xế: {meta?.driverName || '—'})
        </p>
        <p>
          Tổng xuất:{' '}
          <strong className="text-foreground">{summary.total_rolls}</strong> cây
          —{' '}
          <strong className="text-foreground">
            {summary.total_weight_kg.toFixed(1)}
          </strong>{' '}
          kg
        </p>
        {meta?.notes && (
          <p className="text-muted italic">Ghi chú: {meta.notes}</p>
        )}
      </div>

      {groups.map((group) => (
        <div key={group.group_key} className="flex flex-col gap-1">
          <div className="flex justify-between items-center bg-surface-secondary/60 px-2 py-1 font-bold text-[10px] border border-default rounded-t">
            <span>
              {group.fabric_type || 'Vải thành phẩm'} — Màu: {group.color_name}
            </span>
            <span>
              {group.total_rolls} cây • {group.total_weight_kg.toFixed(1)} kg
            </span>
          </div>
          <FabricRollMatrixTable
            rolls={group.rolls}
            rollsPerRow={10}
            compact
            showSubtotal
            interactive={false}
            className="border-t-0 rounded-t-none"
          />
        </div>
      ))}
    </div>
  );
}
