import type { ReactNode } from 'react';

import {
  Badge,
  Icon,
  ActionBar,
  type DataTableColumn,
} from '@/shared/components';
import { formatQuantity } from '@/shared/utils/format';
import { getRollStatusVariant } from '@/shared/utils/status-variant';
import { ROLL_STATUS_LABELS } from '@/schema/finished-fabric.schema';

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
): DataTableColumn<FinishedFabricRoll>[] {
  return [
    {
      header: 'Mã cuộn',
      id: 'roll_number',
      sortable: true,
      cell: (r) => (
        <div className="flex flex-col">
          <span className="font-bold text-primary">{r.roll_number}</span>
          {r.color_name && (
            <span className="text-xs text-muted">{r.color_name}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Loại vải',
      id: 'fabric_type',
      sortable: true,
      cell: (r) => r.fabric_type,
    },
    {
      header: 'CL',
      id: 'quality_grade',
      sortable: true,
      cell: (r) =>
        r.quality_grade ? (
          <span className={`grade-badge grade-${r.quality_grade}`}>
            {r.quality_grade}
          </span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      header: 'Khổ × Dài',
      id: 'length_m',
      sortable: true,
      className: 'text-muted',
      cell: (r) => (
        <div className="flex flex-col text-xs">
          <span>{r.width_cm !== null ? `${r.width_cm} cm` : '—'}</span>
          <span>
            {r.length_m !== null && ` × ${formatQuantity(r.length_m)} m`}
          </span>
        </div>
      ),
    },
    {
      header: 'Trọng lượng',
      id: 'weight_kg',
      sortable: true,
      className: 'text-right',
      cell: (r) => (
        <span className="font-medium">
          {r.weight_kg != null ? `${formatQuantity(r.weight_kg)} kg` : '—'}
        </span>
      ),
    },
    {
      header: 'Trạng thái',
      id: 'status',
      sortable: true,
      cell: (r) => (
        <Badge variant={getRollStatusVariant(r.status)}>
          {ROLL_STATUS_LABELS[r.status]}
        </Badge>
      ),
    },
    {
      header: 'Vị trí',
      id: 'warehouse_location',
      sortable: true,
      cell: (r) => (
        <span className="text-xs text-muted">
          {r.warehouse_location ?? '—'}
        </span>
      ),
    },
    {
      header: 'Thao tác',
      className: 'text-right',
      onCellClick: () => {},
      cell: (r) => (
        <ActionBar
          actions={[
            {
              icon: 'Link',
              onClick: () => actions.onTrace(r),
              title: 'Truy vết',
            },
            {
              icon: 'Pencil',
              onClick: () => actions.onEdit(r),
              title: editBlockReason(r.status) ?? 'Sửa',
              disabled: !canEditRoll(r.status),
            },
            {
              icon: 'Trash2',
              onClick: () => actions.handleDelete(r),
              title: deleteBlockReason(r.status) ?? 'Xóa',
              variant: 'danger',
              disabled: actions.isDeleting || !canDeleteRoll(r.status),
            },
          ]}
        />
      ),
    },
  ];
}

export function renderFinishedFabricMobileCard(
  r: FinishedFabricRoll,
  actions: Omit<ColumnActions, 'isDeleting'>,
): ReactNode {
  return (
    <div className="mobile-card">
      <div className="mobile-card-header">
        <span className="mobile-card-title">{r.roll_number}</span>
        <Badge variant={getRollStatusVariant(r.status)}>
          {ROLL_STATUS_LABELS[r.status]}
        </Badge>
      </div>
      <div className="mobile-card-body">
        <div className="flex justify-between items-start mb-1">
          <span className="text-sm font-bold">{r.fabric_type}</span>
          <span className="text-xs text-muted">{r.color_name}</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-muted">
              Trọng lượng
            </span>
            <span className="text-sm font-medium">
              {r.weight_kg != null
                ? `${r.weight_kg.toLocaleString('vi-VN', { maximumFractionDigits: 3 })} kg`
                : '—'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-muted">Chất lượng</span>
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
          <Icon name="Link" size={16} /> Truy vết
        </button>
        {canEditRoll(r.status) && (
          <button
            className="btn-secondary flex-1 text-primary"
            onClick={(e) => {
              e.stopPropagation();
              actions.onEdit(r);
            }}
          >
            <Icon name="Pencil" size={16} /> Sửa
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
