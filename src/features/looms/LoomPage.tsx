import { useState, type ReactNode } from 'react';

import { TabSwitcher } from '@/shared/components/TabSwitcher';

import { LoomForm } from './LoomForm';
import { LoomList } from './LoomList';
import type { LoomWithSupplier } from './types';
import { MachineSpecList } from './components/MachineSpecList';
import { LOOM_MESSAGES as MSG } from './loom.constants';

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

  const renderTabs = (): ReactNode => (
    <div className="mb-4">
      <TabSwitcher
        active={activeTab}
        onChange={setActiveTab}
        tabs={[
          { key: 'looms', label: MSG.TAB_LOOMS },
          { key: 'machine_specs', label: MSG.TAB_SPECS },
        ]}
        variant="underline"
      />
    </div>
  );

  return (
    <>
      {activeTab === 'looms' && (
        <LoomList onEdit={openEdit} onNew={openCreate} tabs={renderTabs()} />
      )}

      {activeTab === 'machine_specs' && <MachineSpecList tabs={renderTabs()} />}

      {showForm && activeTab === 'looms' && (
        <LoomForm loom={editItem} onClose={closeForm} />
      )}
    </>
  );
}
