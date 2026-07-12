import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import { Badge, ActionBar } from '@/shared/components';
import { ROLL_STATUS_LABELS } from '@/schema/raw-fabric.schema';
import type { RawFabricRoll } from '@/features/raw-fabric/types';
import { RAW_FABRIC_MESSAGES as MSG } from '@/features/raw-fabric/raw-fabric.constants';
import { getRollStatusVariant } from '@/shared/utils/status-variant';
import { formatQuantity } from '@/shared/value/core/formatter';

type UseRawFabricColumnsProps = {
  onEdit: (roll: RawFabricRoll) => void;
};

export function useRawFabricColumns({
  onEdit,
}: UseRawFabricColumnsProps): ColumnDef<RawFabricRoll>[] {
  return useMemo<ColumnDef<RawFabricRoll>[]>(
    () => [
      {
        header: MSG.COL_ROLL_NUMBER,
        id: 'roll_number',
        sortable: true,
        cell: ({ row: { original: r } }) => (
          <span className="font-bold text-primary">{r.roll_number}</span>
        ),
      },
      {
        header: MSG.COL_LOT_NUMBER,
        id: 'lot_number',
        sortable: true,
        cell: ({ row: { original: r } }) => (
          <span className="font-medium text-muted">{r.lot_number || '—'}</span>
        ),
      },
      {
        header: MSG.COL_FABRIC_TYPE,
        id: 'fabric_type',
        sortable: true,
        cell: ({ row: { original: r } }) => (
          <div className="flex flex-col">
            <span className="font-medium">{r.fabric_type}</span>
            <span className="text-xs text-muted">{r.color_name}</span>
          </div>
        ),
      },
      {
        header: MSG.COL_WEIGHT,
        id: 'weight_kg',
        sortable: true,
        meta: { className: 'text-right' },
        cell: ({ row: { original: r } }) => (
          <span className="font-medium">
            {formatQuantity(r.weight_kg)}
            <span className="text-xs ml-1 text-muted">kg</span>
          </span>
        ),
      },
      {
        header: MSG.COL_LENGTH,
        id: 'length_m',
        sortable: true,
        meta: { className: 'text-right' },
        cell: ({ row: { original: r } }) => (
          <span className="font-medium text-success">
            {formatQuantity(r.length_m)}
            <span className="text-xs ml-1 text-muted">m</span>
          </span>
        ),
      },
      {
        header: MSG.COL_STATUS,
        id: 'status',
        sortable: true,
        cell: ({ row: { original: r } }) => (
          <Badge variant={getRollStatusVariant(r.status)}>
            {ROLL_STATUS_LABELS[r.status]}
          </Badge>
        ),
      },
      {
        header: MSG.COL_ACTIONS,
        id: 'actions',
        meta: { className: 'text-right' },
        cell: ({ row: { original: r } }) => (
          <ActionBar
            actions={[
              {
                icon: 'Pencil',
                onClick: () => onEdit(r),
                title: MSG.BTN_EDIT_TITLE,
              },
            ]}
          />
        ),
      },
    ],
    [onEdit],
  );
}
