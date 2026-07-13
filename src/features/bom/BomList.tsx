import type { CellContext } from '@tanstack/react-table';

import { Icon, Badge, type BadgeVariant, ActionBar } from '@/shared/components';
import { DataTableAdvanced } from '@/shared/components/DataTableAdvanced';
import type { ActionConfig } from '@/shared/components';
import { BOM_STATUS_LABELS } from '@/schema/bom.schema';

import { BOM_MESSAGES } from './bom.constants';
import { BomTemplate, BomStatus } from './types';

interface BomListProps {
  boms: BomTemplate[];
  isLoading?: boolean;
  hasFilter?: boolean;
  onSelect: (bom: BomTemplate) => void;
  onEdit: (bom: BomTemplate) => void;
  onDeprecate: (bom: BomTemplate) => void;
  onCreate?: () => void;
}

function getStatusVariant(status: BomStatus): BadgeVariant {
  switch (status) {
    case 'draft':
      return 'gray';
    case 'approved':
      return 'success';
    case 'deprecated':
      return 'danger';
    default:
      return 'gray';
  }
}

export function BomList({
  boms,
  isLoading,
  hasFilter,
  onSelect,
  onEdit,
  onDeprecate,
  onCreate,
}: BomListProps) {
  return (
    <DataTableAdvanced
      data={boms}
      isLoading={isLoading}
      rowKey={(bom) => bom.id}
      onRowClick={(bom) => onSelect(bom)}
      emptyStateTitle={
        hasFilter ? BOM_MESSAGES.NOT_FOUND_TITLE : BOM_MESSAGES.EMPTY_TITLE
      }
      emptyStateDescription={
        hasFilter ? BOM_MESSAGES.NOT_FOUND_DESC : BOM_MESSAGES.EMPTY_DESC
      }
      emptyStateIcon={hasFilter ? 'Search' : 'FileText'}
      emptyStateActionLabel={!hasFilter ? BOM_MESSAGES.BTN_ADD : undefined}
      onEmptyStateAction={!hasFilter && onCreate ? onCreate : undefined}
      exportFileName={BOM_MESSAGES.EXPORT_FILENAME}
      columns={[
        {
          header: 'Mã BOM / Tên Công Thức',
          id: 'code',
          enableSorting: true,
          cell: ({ row }: CellContext<BomTemplate, unknown>) => {
            const bom = row.original;
            return (
              <div className="flex flex-col">
                <span className="font-bold text-primary">{bom.code}</span>
                <span className="text-xs text-muted truncate max-w-[200px]">
                  {bom.name}
                </span>
              </div>
            );
          },
        },
        {
          header: 'Sản Phẩm Mục Tiêu',
          id: 'fabric_name',
          enableSorting: true,
          accessorFn: (bom) => bom.fabric_catalogs?.name || '',
          cell: ({ row }: CellContext<BomTemplate, unknown>) => {
            const bom = row.original;
            return (
              <div className="flex flex-col">
                <span className="font-medium">
                  {bom.fabric_catalogs?.name || '---'}
                </span>
                {bom.target_width_cm && (
                  <span className="text-xs text-muted">
                    Khổ: {bom.target_width_cm}cm
                  </span>
                )}
              </div>
            );
          },
        },
        {
          header: 'Phiên Bản',
          id: 'active_version',
          enableSorting: true,
          cell: ({ row }: CellContext<BomTemplate, unknown>) => {
            const bom = row.original;
            return (
              <Badge variant="gray" className="font-mono text-xs">
                v{bom.active_version}
              </Badge>
            );
          },
        },
        {
          header: 'Trạng Thái',
          id: 'status',
          enableSorting: true,
          cell: ({ row }: CellContext<BomTemplate, unknown>) => {
            const bom = row.original;
            return (
              <Badge variant={getStatusVariant(bom.status)}>
                {BOM_STATUS_LABELS[bom.status as BomStatus]}
              </Badge>
            );
          },
        },
        {
          header: 'Cập Nhật',
          id: 'updated_at',
          enableSorting: true,
          cell: ({ row }: CellContext<BomTemplate, unknown>) => {
            const bom = row.original;
            return (
              <div className="flex flex-col text-sm">
                <span>
                  {new Date(bom.updated_at).toLocaleDateString('vi-VN')}
                </span>
                <span className="text-xs text-muted">
                  bởi {bom.created_by_profile?.full_name || '---'}
                </span>
              </div>
            );
          },
        },
        {
          id: 'actions',
          header: '',
          cell: ({ row }: CellContext<BomTemplate, unknown>) => {
            const bom = row.original;
            const actions: ActionConfig[] = [];
            if (bom.status === 'draft') {
              actions.push({
                icon: 'Pencil',
                title: 'Chỉnh sửa',
                onClick: () => onEdit(bom),
              });
            }
            if (bom.status === 'approved') {
              actions.push({
                icon: 'FilePlus',
                title: 'Tạo bản mới (Revise)',
                onClick: () => onEdit(bom),
              });
              actions.push({
                icon: 'XCircle',
                title: 'Báo phế',
                variant: 'danger',
                onClick: () => onDeprecate(bom),
              });
            }
            if (actions.length === 0) return null;
            return <ActionBar actions={actions} />;
          },
        },
      ]}
      renderMobileCard={(bom) => (
        <div className="mobile-card">
          <div className="mobile-card-header">
            <div className="flex flex-col">
              <span className="mobile-card-title">{bom.code}</span>
              <span className="text-xs text-muted">
                Phiên bản: v{bom.active_version}
              </span>
            </div>
            <Badge variant={getStatusVariant(bom.status)}>
              {BOM_STATUS_LABELS[bom.status] || bom.status}
            </Badge>
          </div>
          <div className="mobile-card-body space-y-2">
            <p className="font-bold">{bom.name}</p>

            <div className="grid grid-cols-2 gap-2 text-sm mt-2">
              <div className="flex flex-col">
                <span className="text-xs text-muted">Sản phẩm Vải</span>
                <span className="font-medium">
                  {bom.fabric_catalogs?.name || '---'}
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-xs text-muted">Khổ mục tiêu</span>
                <span className="font-medium">
                  {bom.target_width_cm ? `${bom.target_width_cm} cm` : '---'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted mt-2">
              <Icon name="User" size={16} />
              <span>
                Người tạo: {bom.created_by_profile?.full_name || 'N/A'}
              </span>
            </div>

            <div className="flex gap-2 pt-3 mt-1 border-t border-border/10">
              <button
                className="btn-secondary flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(bom);
                }}
              >
                <Icon name="Eye" size={16} /> Chi tiết
              </button>
              {bom.status === 'draft' && (
                <button
                  className="btn-secondary flex-1 text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(bom);
                  }}
                >
                  <Icon name="Pencil" size={16} /> Sửa BOM
                </button>
              )}
              {bom.status === 'approved' && (
                <button
                  className="btn-secondary flex-1 text-danger border-danger/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeprecate(bom);
                  }}
                >
                  <Icon name="AlertTriangle" size={16} /> Báo phế
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    />
  );
}
