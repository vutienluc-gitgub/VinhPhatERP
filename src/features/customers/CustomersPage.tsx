import { useState } from 'react';

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { ContractForm } from '@/features/contracts/ContractForm';
// eslint-disable-next-line boundaries/dependencies
import { ChatDrawer } from '@/features/chat/ChatDrawer';
import { usePreviewIdFromUrl } from '@/shared/hooks/usePreviewIdFromUrl';

import { CustomerForm } from './CustomerForm';
import { CustomerList } from './CustomerList';
import { DepositForm } from './DepositForm';
import type { Customer } from './types';

export function CustomersPage() {
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [contractCustomer, setContractCustomer] = useState<Customer | null>(
    null,
  );
  const [depositCustomer, setDepositCustomer] = useState<Customer | null>(null);
  const [chatCustomer, setChatCustomer] = useState<Customer | null>(null);

  usePreviewIdFromUrl('customer');

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
        onDeposit={(c) => setDepositCustomer(c)}
        onChat={(c) => setChatCustomer(c)}
      />

      <AdaptiveSheet
        open={showForm}
        onClose={closeForm}
        title={
          editCustomer ? `Sửa: ${editCustomer.name}` : 'Thêm khách hàng mới'
        }
      >
        <CustomerForm customer={editCustomer} onClose={closeForm} />
      </AdaptiveSheet>

      <AdaptiveSheet
        open={!!contractCustomer}
        onClose={() => setContractCustomer(null)}
        title="Tạo hợp đồng"
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

      {depositCustomer && (
        <DepositForm
          customerId={depositCustomer.id}
          customerName={depositCustomer.name}
          onClose={() => setDepositCustomer(null)}
        />
      )}

      <ChatDrawer
        open={!!chatCustomer}
        onClose={() => setChatCustomer(null)}
        entityType="customer"
        entityId={chatCustomer?.id ?? ''}
        title={chatCustomer?.name ?? ''}
        subtitle="Trò chuyện trực tiếp"
      />
    </div>
  );
}
