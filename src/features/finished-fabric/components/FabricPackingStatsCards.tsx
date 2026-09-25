import React from 'react';

import type { PackingListTotal } from '@/domain/inventory/packing-list.types';
import { PACKING_LIST_TEXT } from '@/features/finished-fabric/packing-list.constants';

interface FabricPackingStatsCardsProps {
  summary: PackingListTotal;
}

export const FabricPackingStatsCards: React.FC<
  FabricPackingStatsCardsProps
> = ({ summary }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      <div className="p-3 rounded-xl border border-border bg-surface">
        <div className="text-[11px] font-semibold text-muted uppercase">
          {PACKING_LIST_TEXT.TOTAL_ROLLS}
        </div>
        <div className="text-lg font-extrabold text-foreground mt-0.5">
          {summary.total_rolls}{' '}
          <span className="text-xs font-medium text-muted">cây</span>
        </div>
      </div>

      <div className="p-3 rounded-xl border border-border bg-surface">
        <div className="text-[11px] font-semibold text-muted uppercase">
          {PACKING_LIST_TEXT.TOTAL_WEIGHT}
        </div>
        <div className="text-lg font-extrabold text-foreground mt-0.5">
          {summary.total_weight_kg}{' '}
          <span className="text-xs font-medium text-muted">kg</span>
        </div>
      </div>

      <div className="p-3 rounded-xl border border-border bg-surface">
        <div className="text-[11px] font-semibold text-muted uppercase">
          {PACKING_LIST_TEXT.AVG_WEIGHT}
        </div>
        <div className="text-lg font-extrabold text-foreground mt-0.5">
          {summary.average_weight_kg}{' '}
          <span className="text-xs font-medium text-muted">kg/cây</span>
        </div>
      </div>

      <div className="p-3 rounded-xl border border-border bg-surface">
        <div className="text-[11px] font-semibold text-muted uppercase">
          Phẩm cấp
        </div>
        <div className="text-xs font-bold text-foreground mt-1 flex items-center gap-2">
          <span className="text-success">{summary.grade_a_count} Loại A</span>
          {summary.grade_b_count > 0 && (
            <span className="text-warning">
              • {summary.grade_b_count} Loại B
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
