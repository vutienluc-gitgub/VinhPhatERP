import { useState } from 'react';

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { ContractForm } from '@/features/contracts/ContractForm';

import { CustomerForm } from './CustomerForm';
import { CustomerList } from './CustomerList';
import type { Customer } from './types';

export function CustomersPage() {
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [contractCustomer, setContractCustomer] = useState<Customer | null>(
    null,
  );

  function openCreate() {
    setEditCustomer(null);
    setShowForm(true);
  }

  function openEdit(customer: Customer) {
    setEditCustomer(customer);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditCustomer(null);
  }

  return (
    <div className="page-container">
      <CustomerList
        onEdit={openEdit}
        onNew={openCreate}
        onCreateContract={(c) => setContractCustomer(c)}
      />

      <AdaptiveSheet
        open={showForm}
        onClose={closeForm}
        title={
          editCustomer ? `Sua: ${editCustomer.name}` : 'Them khach hang moi'
        }
      >
        <CustomerForm customer={editCustomer} onClose={closeForm} />
      </AdaptiveSheet>

      <AdaptiveSheet
        open={!!contractCustomer}
        onClose={() => setContractCustomer(null)}
        title="Tao hop dong"
      >
        {contractCustomer && (
          <ContractForm
            defaultSourceType="customer"
            defaultSourceId={contractCustomer.id}
            defaultSourceName={contractCustomer.name}
            onSuccess={() => setContractCustomer(null)}
            onCancel={() => setContractCustomer(null)}
          />
        )}
      </AdaptiveSheet>
    </div>
  );
}
