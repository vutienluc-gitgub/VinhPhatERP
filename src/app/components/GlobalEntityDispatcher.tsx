import { lazy, Suspense } from 'react';

import { useGlobalEntity } from '@/shared/contexts/GlobalEntityContext';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { ENTITY_LABELS } from '@/shared/constants/entity.constants';
import type { EntityType } from '@/shared/constants/entity.constants';
import { useCustomerById } from '@/application/crm/useCustomers';
import { useSupplierById } from '@/application/crm/useSuppliers';
import { Icon } from '@/shared/components/Icon';

const CustomerForm = lazy(() =>
  import('@/features/customers/CustomerForm').then((m) => ({
    default: m.CustomerForm,
  })),
);

const SupplierForm = lazy(() =>
  import('@/features/suppliers/SupplierForm').then((m) => ({
    default: m.SupplierForm,
  })),
);

/* ── Shared loading / empty / error states ─────────────────── */

function PreviewLoading() {
  return (
    <div className="flex items-center justify-center p-8 h-40">
      <Icon name="Loader2" className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function PreviewEmpty({ entityType }: { entityType: EntityType }) {
  const label = ENTITY_LABELS[entityType] ?? entityType;
  return (
    <div className="p-8 text-center text-muted-foreground">
      Không tìm thấy thông tin {label}.
    </div>
  );
}

function PreviewError({
  entityType,
  error,
}: {
  entityType: EntityType;
  error: unknown;
}) {
  const label = ENTITY_LABELS[entityType] ?? entityType;
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="p-8 text-center text-danger">
      Lỗi khi tải thông tin {label}: {message}
    </div>
  );
}

/* ── Entity preview wrappers ───────────────────────────────── */

function CustomerPreviewWrapper({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const { data: customer, isLoading, error } = useCustomerById(id);

  if (isLoading) return <PreviewLoading />;
  if (error) return <PreviewError entityType="customer" error={error} />;
  if (!customer) return <PreviewEmpty entityType="customer" />;

  return <CustomerForm customer={customer} onClose={onClose} />;
}

function SupplierPreviewWrapper({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const { data: supplier, isLoading, error } = useSupplierById(id);

  if (isLoading) return <PreviewLoading />;
  if (error) return <PreviewError entityType="supplier" error={error} />;
  if (!supplier) return <PreviewEmpty entityType="supplier" />;

  return <SupplierForm supplier={supplier} onClose={onClose} />;
}

/* ── Dispatcher ────────────────────────────────────────────── */

function getEntityTitle(type: EntityType): string {
  const label = ENTITY_LABELS[type] ?? type;
  // Capitalize first letter
  return `Chi tiết ${label}`;
}

function renderEntityPreview(
  type: EntityType,
  id: string,
  onClose: () => void,
) {
  switch (type) {
    case 'customer':
      return (
        <AdaptiveSheet
          open
          onClose={onClose}
          title={getEntityTitle('customer')}
        >
          <CustomerPreviewWrapper id={id} onClose={onClose} />
        </AdaptiveSheet>
      );
    case 'supplier':
      return (
        <AdaptiveSheet
          open
          onClose={onClose}
          title={getEntityTitle('supplier')}
        >
          <SupplierPreviewWrapper id={id} onClose={onClose} />
        </AdaptiveSheet>
      );
    // Expand with 'yarn', 'loom', 'employee', 'order', 'fabric' later
    default:
      return null;
  }
}

export function GlobalEntityDispatcher() {
  const { previewEntity, closeEntity } = useGlobalEntity();

  if (!previewEntity) return null;

  return (
    <Suspense fallback={null}>
      {renderEntityPreview(previewEntity.type, previewEntity.id, closeEntity)}
    </Suspense>
  );
}
