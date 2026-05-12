import { useState } from 'react';

import {
  Icon,
  Badge,
  type BadgeVariant,
  AddButton,
  ActionBar,
} from '@/shared/components';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  useFabricVariants,
  useDeleteFabricVariant,
} from '@/application/settings';
import {
  FABRIC_VARIANT_STATUS_LABELS,
  FABRIC_VARIANT_STATUSES,
} from '@/schema/fabric-variant.schema';
import type {
  FabricVariant,
  FabricVariantStatus,
} from '@/domain/settings/fabric-catalog.types';

import { FabricVariantForm } from './FabricVariantForm';

function getVariantStatusVariant(status: FabricVariantStatus): BadgeVariant {
  switch (status) {
    case 'active':
      return 'success';
    case 'draft':
      return 'warning';
    case 'discontinued':
      return 'gray';
    default:
      return 'gray';
  }
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('vi-VN').format(value);
}

type FabricVariantListProps = {
  fabricCatalogId: string;
  parentCode: string;
};

export function FabricVariantList({
  fabricCatalogId,
  parentCode,
}: FabricVariantListProps) {
  const [editing, setEditing] = useState<FabricVariant | null>(null);
  const [creating, setCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<FabricVariantStatus | ''>(
    '',
  );

  const { data: variants, isLoading } = useFabricVariants(
    fabricCatalogId,
    statusFilter ? { status: statusFilter as FabricVariantStatus } : {},
  );
  const deleteMutation = useDeleteFabricVariant();
  const { confirm } = useConfirm();

  async function handleDelete(v: FabricVariant) {
    const ok = await confirm({
      message: `Xóa biến thể "${v.variant_code}"? Hành động này không thể hoàn tác.`,
      variant: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(v.id);
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="h-16 rounded-lg bg-surface-subtle animate-pulse"
          />
        ))}
      </div>
    );
  }

  const items = variants ?? [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold">Biến thể màu</h3>
          <span className="badge badge-info">{items.length}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Status filter pills */}
          <div className="hidden sm:flex gap-1">
            <button
              className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                statusFilter === ''
                  ? 'bg-primary text-white border-primary'
                  : 'border-border text-muted hover:border-primary'
              }`}
              onClick={() => setStatusFilter('')}
            >
              Tất cả
            </button>
            {FABRIC_VARIANT_STATUSES.map((s) => (
              <button
                key={s}
                className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                  statusFilter === s
                    ? 'bg-primary text-white border-primary'
                    : 'border-border text-muted hover:border-primary'
                }`}
                onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              >
                {FABRIC_VARIANT_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <AddButton onClick={() => setCreating(true)} label="Thêm biến thể" />
        </div>
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="py-12 text-center">
          <Icon
            name="Palette"
            size={40}
            className="text-muted mx-auto mb-3 opacity-40"
          />
          <p className="text-muted font-medium">Chưa có biến thể nào</p>
          <p className="text-xs text-muted mt-1">
            Nhấn "Thêm biến thể" để tạo biến thể màu đầu tiên.
          </p>
        </div>
      )}

      {/* Variant Cards */}
      {items.length > 0 && (
        <div className="p-4 space-y-3">
          {items.map((v) => (
            <div
              key={v.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-border bg-surface-strong hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => setEditing(v)}
            >
              {/* Color swatch */}
              <div
                className="w-10 h-10 rounded-lg border border-border shrink-0 mt-0.5"
                style={{
                  backgroundColor: v.color_hex ?? '#e5e7eb',
                }}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-primary text-sm">
                    {v.variant_code}
                  </span>
                  <Badge variant={getVariantStatusVariant(v.status)}>
                    {FABRIC_VARIANT_STATUS_LABELS[v.status]}
                  </Badge>
                </div>
                <p className="text-sm font-medium mt-0.5">{v.color_name}</p>

                {/* Specs row */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted">
                  {v.actual_width_cm !== null && (
                    <span>
                      Khổ:{' '}
                      <strong className="text-text">
                        {v.actual_width_cm}cm
                      </strong>
                    </span>
                  )}
                  {v.actual_gsm !== null && (
                    <span>
                      K/L:{' '}
                      <strong className="text-text">{v.actual_gsm}gsm</strong>
                    </span>
                  )}
                  {v.conversion_rate !== null && (
                    <span>
                      Quy đổi:{' '}
                      <strong className="text-text">
                        {v.conversion_rate} m/kg
                      </strong>
                    </span>
                  )}
                  {v.moq !== null && (
                    <span>
                      MOQ: <strong className="text-text">{v.moq}kg</strong>
                    </span>
                  )}
                </div>

                {/* Pricing row */}
                {(v.purchase_price !== null || v.selling_price !== null) && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted">
                    {v.purchase_price !== null && (
                      <span>
                        Nhập:{' '}
                        <strong className="text-text">
                          {formatCurrency(v.purchase_price)}
                        </strong>
                      </span>
                    )}
                    {v.selling_price !== null && (
                      <span>
                        Bán:{' '}
                        <strong className="text-success">
                          {formatCurrency(v.selling_price)}
                        </strong>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                <ActionBar
                  actions={[
                    {
                      icon: 'Pencil',
                      onClick: () => setEditing(v),
                      title: 'Chỉnh sửa',
                    },
                    {
                      icon: 'Trash2',
                      onClick: () => handleDelete(v),
                      title: 'Xóa',
                      variant: 'danger',
                      disabled: deleteMutation.isPending,
                    },
                  ]}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Variant Form Modal */}
      {(creating || editing) && (
        <FabricVariantForm
          variant={editing}
          fabricCatalogId={fabricCatalogId}
          parentCode={parentCode}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
