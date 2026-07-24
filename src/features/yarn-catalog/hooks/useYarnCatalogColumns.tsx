import { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';

import { Badge, ActionBar } from '@/shared/components';
import {
  getYarnTypeLabel,
  getYarnCategoryLabel,
} from '@/shared/constants/yarn-classification';
import { LABEL_ORIGIN } from '@/shared/constants/origin.constants';
import type { YarnCatalog } from '@/features/yarn-catalog/types';
import { YarnColorBadge } from '@/features/yarn-catalog/components/YarnColorBadge';
import { StatusBadge } from '@/shared/components';

export function useYarnCatalogColumns(
  onEdit: (catalog: YarnCatalog) => void,
  onDelete: (catalog: YarnCatalog) => void,
  isDeleting: boolean,
) {
  const columnHelper = createColumnHelper<YarnCatalog>();

  return useMemo(
    () => [
      columnHelper.accessor('code', {
        header: 'Mã / Tên',
        cell: (info) => {
          const c = info.row.original;
          return (
            <div className="flex flex-col max-w-[200px]">
              <span className="font-bold text-primary truncate" title={c.code}>
                {c.code}
              </span>
              <span className="text-sm truncate" title={c.name}>
                {c.name}
              </span>
              <YarnColorBadge colorName={c.color_name} />
            </div>
          );
        },
      }),
      columnHelper.accessor('composition', {
        header: 'Thành phần',
        cell: (info) => {
          const c = info.row.original;
          return (
            <span
              className="text-sm text-muted block truncate max-w-[150px]"
              title={c.composition ?? ''}
            >
              {c.composition ?? '—'}
            </span>
          );
        },
      }),
      columnHelper.accessor('origin', {
        header: LABEL_ORIGIN,
        cell: (info) => {
          const c = info.row.original;
          return (
            <span
              className="text-sm block truncate max-w-[120px]"
              title={c.origin ?? ''}
            >
              {c.origin ?? '—'}
            </span>
          );
        },
      }),
      columnHelper.accessor('category', {
        header: 'Nhóm sợi (Lv1)',
        cell: (info) => {
          const c = info.row.original;
          const label = getYarnCategoryLabel(c.category);
          return (
            <span
              className="text-sm block truncate max-w-[140px]"
              title={label}
            >
              {label || '—'}
            </span>
          );
        },
      }),
      columnHelper.accessor('yarn_type', {
        header: 'Loại sợi (Lv2)',
        cell: (info) => {
          const c = info.row.original;
          const label = getYarnTypeLabel(c.yarn_type);
          const specs = c.denier
            ? `${c.denier}${c.filament_count ? `/${c.filament_count}` : ''}`
            : c.count_ne
              ? `${c.count_ne}${c.spinning_method ? ` · ${c.spinning_method}` : ''}`
              : null;
          return (
            <div className="flex flex-col max-w-[180px]">
              <span
                className="text-sm font-medium text-primary truncate"
                title={label}
              >
                {label || '—'}
              </span>
              {specs && (
                <span className="text-xs text-muted truncate" title={specs}>
                  {specs}
                </span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('lot_no', {
        header: 'Mã lô',
        cell: (info) => {
          const c = info.row.original;
          return (
            <span
              className="text-sm font-mono text-primary block truncate max-w-[120px]"
              title={c.lot_no ?? ''}
            >
              {c.lot_no ?? '—'}
            </span>
          );
        },
      }),
      columnHelper.accessor('grade', {
        header: 'Loại',
        meta: { className: 'text-center' },
        cell: (info) => {
          const c = info.row.original;
          return (
            <Badge
              variant="gray"
              className="min-w-[40px] justify-center"
              showDot={false}
            >
              {c.grade ?? '—'}
            </Badge>
          );
        },
      }),
      columnHelper.accessor('unit', {
        header: 'Đơn vị',
        meta: { className: 'font-medium' },
      }),
      columnHelper.accessor('status', {
        header: 'Trạng thái',
        cell: (info) => {
          const c = info.row.original;
          return <StatusBadge domain="YARN" status={c.status} />;
        },
      }),
      columnHelper.accessor('notes', {
        header: 'Ghi chú',
        cell: (info) => {
          const c = info.row.original;
          return (
            <span
              className="text-sm text-muted italic truncate max-w-[200px] block"
              title={c.notes ?? ''}
            >
              {c.notes ?? '—'}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Thao tác',
        meta: { className: 'text-right' },
        cell: (info) => {
          const c = info.row.original;
          return (
            <ActionBar
              actions={[
                {
                  icon: 'Pencil',
                  onClick: () => onEdit(c),
                  title: 'Sửa',
                },
                {
                  icon: 'Trash2',
                  onClick: () => onDelete(c),
                  title: 'Xóa',
                  variant: 'danger',
                  disabled: isDeleting,
                },
              ]}
            />
          );
        },
      }),
    ],
    [columnHelper, onEdit, onDelete, isDeleting],
  );
}
