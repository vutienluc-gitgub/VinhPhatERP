import { useState } from 'react';

import { TabSwitcher } from '@/shared/components/TabSwitcher';

import { LoomForm } from './LoomForm';
import { LoomList } from './LoomList';
import type { LoomWithSupplier } from './types';
import { MachineSpecList } from './components/MachineSpecList';

type TabType = 'looms' | 'machine_specs';

export function LoomPage() {
  const [activeTab, setActiveTab] = useState<TabType>('looms');
  const [editItem, setEditItem] = useState<LoomWithSupplier | null>(null);
  const [showForm, setShowForm] = useState(false);

  function openCreate() {
    setEditItem(null);
    setShowForm(true);
  }

  function openEdit(loom: LoomWithSupplier) {
    setEditItem(loom);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditItem(null);
  }

  return (
    <div className="page-container">
      <div className="mb-4">
        <TabSwitcher
          active={activeTab}
          onChange={setActiveTab}
          tabs={[
            { key: 'looms', label: 'Máy dệt (Looms)' },
            { key: 'machine_specs', label: 'Cấu hình máy (Machine Specs)' },
          ]}
          variant="underline"
        />
      </div>

      {activeTab === 'looms' && (
        <LoomList onEdit={openEdit} onNew={openCreate} />
      )}

      {activeTab === 'machine_specs' && <MachineSpecList />}

      {showForm && activeTab === 'looms' && (
        <LoomForm loom={editItem} onClose={closeForm} />
      )}
    </div>
  );
}
