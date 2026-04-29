import { useState } from 'react';

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { ContractForm } from '@/features/contracts/ContractForm';

import { SupplierForm } from './SupplierForm';
import { SuppliersList } from './SuppliersList';
import type { Supplier } from './types';

export function SuppliersPage() {
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [contractSupplier, setContractSupplier] = useState<Supplier | null>(
    null,
  );

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
      <SuppliersList
        onEdit={openEdit}
        onNew={openCreate}
        onCreateContract={(s) => setContractSupplier(s)}
      />

      {showForm && <SupplierForm supplier={editSupplier} onClose={closeForm} />}

      <AdaptiveSheet
        open={!!contractSupplier}
        onClose={() => setContractSupplier(null)}
        title="Tạo hợp đồng"
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
