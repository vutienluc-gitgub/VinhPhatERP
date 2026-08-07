import { useState } from 'react';

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { TabSwitcher } from '@/shared/components/TabSwitcher';
import { ContractForm } from '@/features/contracts/ContractForm';
// eslint-disable-next-line boundaries/dependencies
import { ChatDrawer } from '@/features/chat/ChatDrawer';
import { usePreviewIdFromUrl } from '@/shared/hooks/usePreviewIdFromUrl';
import { useContextualGuide } from '@/features/guide-system/hooks/useContextualGuide';
import { PageLayout } from '@/shared/components';
import { ContextualGuide } from '@/features/guide-system/components/ContextualGuide';

import { CUSTOMERS_PAGE_LABELS } from './customers.constants';
import { CustomerForm } from './CustomerForm';
import { CustomerList } from './CustomerList';
import { DepositForm } from './DepositForm';
import { CustomerGroupList } from './components/CustomerGroupList';
import type { Customer } from './types';

export function CustomersPage() {
  const [activeTab, setActiveTab] = useState<'customers' | 'customer_groups'>(
    'customers',
  );
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [contractCustomer, setContractCustomer] = useState<Customer | null>(
    null,
  );
  const [depositCustomer, setDepositCustomer] = useState<Customer | null>(null);
  const [chatCustomer, setChatCustomer] = useState<Customer | null>(null);

  const { activeGuides } = useContextualGuide('Customers');

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
      <PageLayout className="flex-1 h-full">
        {/* Tab Switcher for CRM Modules */}
        <div className="pb-2 min-w-0">
          <TabSwitcher
            active={activeTab}
            onChange={setActiveTab}
            className="!border-b-0"
            tabs={[
              { key: 'customers', label: CUSTOMERS_PAGE_LABELS.tabCustomers },
              {
                key: 'customer_groups',
                label: CUSTOMERS_PAGE_LABELS.tabGroups,
              },
            ]}
          />
        </div>

        {activeTab === 'customers' && (
          <CustomerList
            onEdit={openEdit}
            onNew={openCreate}
            onCreateContract={(c) => setContractCustomer(c)}
            onDeposit={(c) => setDepositCustomer(c)}
            onChat={(c) => setChatCustomer(c)}
          />
        )}

        {activeTab === 'customer_groups' && <CustomerGroupList />}
      </PageLayout>

      <AdaptiveSheet
        open={showForm && activeTab === 'customers'}
        onClose={closeForm}
        title={
          editCustomer
            ? `${CUSTOMERS_PAGE_LABELS.editPrefix} ${editCustomer.name}`
            : CUSTOMERS_PAGE_LABELS.createTitle
        }
      >
        <CustomerForm customer={editCustomer} onClose={closeForm} />
      </AdaptiveSheet>

      <AdaptiveSheet
        open={!!contractCustomer}
        onClose={() => setContractCustomer(null)}
        title={CUSTOMERS_PAGE_LABELS.createContractTitle}
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
        subtitle={CUSTOMERS_PAGE_LABELS.chatSubtitle}
      />

      <ContextualGuide activeGuides={activeGuides} />
    </div>
  );
}
