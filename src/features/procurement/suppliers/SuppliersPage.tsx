import { useState } from 'react';

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { PageLayout } from '@/shared/components';
import { ContractForm } from '@/features/contracts/ContractForm';
import { usePreviewIdFromUrl } from '@/shared/hooks/usePreviewIdFromUrl';
import { SUPPLIER_LABELS as L } from '@/features/procurement/procurement.constants';
import type { Supplier } from '@/domain/crm/suppliers.types';

import { SupplierForm } from './SupplierForm';
import { SuppliersList } from './SuppliersList';

export function SuppliersPage() {
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [contractSupplier, setContractSupplier] = useState<Supplier | null>(
    null,
  );

  usePreviewIdFromUrl('supplier');

  function openCreate() {
    setEditSupplier(null);
    setShowForm(true);
  }

  function openEdit(supplier: Supplier) {
    setEditSupplier(supplier);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditSupplier(null);
  }

  return (
    <div className="page-container">
      <PageLayout className="flex-1 h-full">
        <SuppliersList
          onEdit={openEdit}
          onNew={openCreate}
          onCreateContract={(s) => setContractSupplier(s)}
        />
      </PageLayout>

      {showForm && <SupplierForm supplier={editSupplier} onClose={closeForm} />}

      <AdaptiveSheet
        open={!!contractSupplier}
        onClose={() => setContractSupplier(null)}
        title={L.CREATE_CONTRACT_TITLE}
      >
        {contractSupplier && (
          <ContractForm
            defaultSourceType="supplier"
            defaultSourceId={contractSupplier.id}
            defaultSourceName={contractSupplier.name}
            onSuccess={() => setContractSupplier(null)}
            onCancel={() => setContractSupplier(null)}
          />
        )}
      </AdaptiveSheet>
    </div>
  );
}
