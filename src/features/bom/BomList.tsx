import {
  Icon,
  Badge,
  type BadgeVariant,
  DataTablePremium,
  ActionBar,
} from '@/shared/components';
import type { ActionConfig } from '@/shared/components';

import { BOM_STATUS_LABELS } from './bom.module';
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
    <DataTablePremium
      data={boms}
      isLoading={isLoading}
      rowKey={(bom) => bom.id}
      onRowClick={(bom) => onSelect(bom)}
      emptyStateTitle={
        hasFilter
          ? 'Không tìm thấy công thức định mức (BOM)'
          : 'Chưa có công thức định mức (BOM) nào'
      }
      emptyStateDescription={
        hasFilter
          ? 'Vui lòng thử điều chỉnh lại bộ lọc.'
          : 'Nhấn "Tạo bản nháp" để bắt đầu xây dựng BOM.'
      }
      emptyStateIcon={hasFilter ? 'Search' : 'FileText'}
      emptyStateActionLabel={!hasFilter ? '+ Tạo bản nháp' : undefined}
      onEmptyStateAction={!hasFilter && onCreate ? onCreate : undefined}
      columns={[
        {
          header: 'Mã BOM / Tên Công Thức',
          id: 'code',
          sortable: true,
          cell: (bom) => (
            <div className="flex flex-col">
              <span className="font-bold text-primary">{bom.code}</span>
              <span className="text-xs text-muted truncate max-w-[200px]">
                {bom.name}
              </span>
            </div>
          ),
        },
        {
          header: 'Sản Phẩm Mục Tiêu',
          id: 'fabric_name',
          sortable: true,
          accessor: (bom) => bom.fabric_catalogs?.name || '',
          cell: (bom) => (
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
          ),
        },
        {
          header: 'Phiên Bản',
          id: 'active_version',
          sortable: true,
          cell: (bom) => (
            <span className="font-medium text-sm">v{bom.active_version}</span>
          ),
        },
        {
          header: 'Trạng Thái',
          id: 'status',
          sortable: true,
          cell: (bom) => (
            <Badge variant={getStatusVariant(bom.status)}>
              {BOM_STATUS_LABELS[bom.status] || bom.status}
            </Badge>
          ),
        },
        {
          header: 'Người Tạo',
          id: 'created_by',
          sortable: true,
          accessor: (bom) => bom.created_by_profile?.full_name || '',
          className: 'td-muted text-sm',
          cell: (bom) => bom.created_by_profile?.full_name || 'N/A',
        },
        {
          header: 'Thao tác',
          className: 'text-right',
          onCellClick: () => {},
          cell: (bom) => (
            <ActionBar
              actions={
                [
                  {
                    icon: 'Eye',
                    onClick: () => onSelect(bom),
                    title: 'Chi tiết',
                  },
                  bom.status === 'draft'
                    ? {
                        icon: 'Pencil',
                        onClick: () => onEdit(bom),
                        title: 'Sửa bản nháp',
                      }
                    : null,
                  bom.status === 'approved'
                    ? {
                        icon: 'AlertTriangle',
                        onClick: () => onDeprecate(bom),
                        title: 'Báo phế',
                        variant: 'danger',
                      }
                    : null,
                ].filter(Boolean) as ActionConfig[]
              }
            />
          ),
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
