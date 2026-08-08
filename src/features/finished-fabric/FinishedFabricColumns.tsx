import type { ReactNode } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import { Badge, Icon, ActionBar } from '@/shared/components';
import { formatQuantity } from '@/shared/value/core/formatter';
import { getRollStatusVariant } from '@/shared/utils/status-variant';
import { ROLL_STATUS_LABELS } from '@/schema/finished-fabric.schema';

import { FINISHED_FABRIC_LIST_LABELS as LIST_MSG } from './finished-fabric.constants';
import {
  canDeleteRoll,
  canEditRoll,
  deleteBlockReason,
  editBlockReason,
} from './transitions';
import type { FinishedFabricRoll } from './types';

interface ColumnActions {
  onTrace: (roll: FinishedFabricRoll) => void;
  onEdit: (roll: FinishedFabricRoll) => void;
  handleDelete: (roll: FinishedFabricRoll) => void;
  isDeleting: boolean;
}

export function getFinishedFabricColumns(
  actions: ColumnActions,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ColumnDef<FinishedFabricRoll, any>[] {
  return [
    {
      id: 'thumbnail',
      header: '',
      meta: { className: 'w-12' },
      cell: ({ row }) => {
        const r = row.original;
        return r.image_url ? (
          <img
            src={r.image_url}
            alt={r.roll_number}
            className="w-10 h-10 rounded object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-10 h-10 rounded bg-surface-subtle flex items-center justify-center">
            <Icon name="Image" size={16} className="text-muted-foreground" />
          </div>
        );
      },
    },
    {
      accessorKey: 'roll_number',
      header: LIST_MSG.COL_ROLL_NUMBER,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-bold text-foreground">{r.roll_number}</span>
            {r.color_name && (
              <span className="text-xs text-muted-foreground">
                {r.color_name}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'fabric_type',
      header: LIST_MSG.COL_FABRIC_TYPE,
      cell: ({ row }) => row.original.fabric_type,
    },
    {
      accessorKey: 'quality_grade',
      header: 'CL',
      cell: ({ row }) => {
        const r = row.original;
        return r.quality_grade ? (
          <span className={`grade-badge grade-${r.quality_grade}`}>
            {r.quality_grade}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: 'length_m',
      header: 'Khổ × Dài',
      meta: { className: 'text-muted-foreground' },
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex flex-col text-xs">
            <span>{r.width_cm !== null ? `${r.width_cm} cm` : '—'}</span>
            <span>
              {r.length_m !== null && ` × ${formatQuantity(r.length_m)} m`}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'weight_kg',
      header: LIST_MSG.COL_WEIGHT,
      meta: { className: 'text-right' },
      cell: ({ row }) => {
        const r = row.original;
        return (
          <span className="font-medium">
            {r.weight_kg != null ? `${formatQuantity(r.weight_kg)} kg` : '—'}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: LIST_MSG.COL_STATUS,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <Badge variant={getRollStatusVariant(r.status)}>
            {ROLL_STATUS_LABELS[r.status]}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'warehouse_location',
      header: 'Vị trí',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.warehouse_location ?? '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">{LIST_MSG.COL_ACTIONS}</div>,
      meta: { className: 'text-right' },
      cell: ({ row }) => {
        const r = row.original;
        return (
          <ActionBar
            actions={[
              {
                icon: 'Link',
                onClick: () => actions.onTrace(r),
                title: LIST_MSG.BTN_TRACE_TITLE,
              },
              {
                icon: 'Pencil',
                onClick: () => actions.onEdit(r),
                title: editBlockReason(r.status) ?? LIST_MSG.BTN_EDIT_TITLE,
                disabled: !canEditRoll(r.status),
              },
              {
                icon: 'Trash2',
                onClick: () => actions.handleDelete(r),
                title: deleteBlockReason(r.status) ?? LIST_MSG.BTN_DELETE_TITLE,
                variant: 'danger',
                disabled: actions.isDeleting || !canDeleteRoll(r.status),
              },
            ]}
          />
        );
      },
    },
  ];
}

export function renderFinishedFabricMobileCard(
  r: FinishedFabricRoll,
  actions: Omit<ColumnActions, 'isDeleting'>,
): ReactNode {
  return (
    <div className="mobile-card">
      {r.image_url && (
        <img
          src={r.image_url}
          alt={r.roll_number}
          className="w-full h-32 object-cover rounded-t-lg"
          style={{
            margin: '-1.25rem -1.25rem 0.75rem',
            width: 'calc(100% + 2.5rem)',
          }}
          loading="lazy"
        />
      )}
      <div className="mobile-card-header">
        <span className="mobile-card-title">{r.roll_number}</span>
        <Badge variant={getRollStatusVariant(r.status)}>
          {ROLL_STATUS_LABELS[r.status]}
        </Badge>
      </div>
      <div className="mobile-card-body">
        <div className="flex justify-between items-start mb-1">
          <span className="text-sm font-bold">{r.fabric_type}</span>
          <span className="text-xs text-muted-foreground">{r.color_name}</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-muted-foreground">
              Trọng lượng
            </span>
            <span className="text-sm font-medium">
              {r.weight_kg != null
                ? `${formatQuantity(r.weight_kg, 3)} kg`
                : '—'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-muted-foreground">
              Chất lượng
            </span>
            <span className="text-sm font-bold">{r.quality_grade || '—'}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 pt-2 border-t border-border/10">
        <button
          className="btn-secondary flex-1"
          onClick={(e) => {
            e.stopPropagation();
            actions.onTrace(r);
          }}
        >
          <Icon name="Link" size={16} /> {LIST_MSG.BTN_TRACE_TITLE}
        </button>
        {canEditRoll(r.status) && (
          <button
            className="btn-secondary flex-1 text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              actions.onEdit(r);
            }}
          >
            <Icon name="Pencil" size={16} /> {LIST_MSG.BTN_EDIT_TITLE}
          </button>
        )}
        {canDeleteRoll(r.status) && (
          <button
            className="btn-secondary text-danger px-3"
            onClick={(e) => {
              e.stopPropagation();
              actions.handleDelete(r);
            }}
          >
            <Icon name="Trash2" size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
