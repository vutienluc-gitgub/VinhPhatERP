import { useState } from 'react';

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';

import { ContractsPage } from './ContractsPage';
import { ContractDetailPage } from './ContractDetailPage';
import { ContractForm } from './ContractForm';

type View = { mode: 'list' } | { mode: 'detail'; contractId: string };

export function ContractsFeature() {
  const [view, setView] = useState<View>({ mode: 'list' });
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      {view.mode === 'list' ? (
        <ContractsPage
          onView={(contract) =>
            setView({
              mode: 'detail',
              contractId: contract.id,
            })
          }
          onNew={() => setShowForm(true)}
        />
      ) : (
        <ContractDetailPage
          contractId={view.contractId}
          onBack={() => setView({ mode: 'list' })}
        />
      )}

      {/* Sheet tạo hợp đồng mới thủ công từ giao diện Quản lý Hợp Đồng */}
      <AdaptiveSheet
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Tạo hợp đồng mới"
      >
        {showForm && (
          <ContractForm
            onSuccess={(contractId) => {
              setShowForm(false);
              setView({
                mode: 'detail',
                contractId,
              });
            }}
            onCancel={() => setShowForm(false)}
          />
        )}
      </AdaptiveSheet>
    </>
  );
}
