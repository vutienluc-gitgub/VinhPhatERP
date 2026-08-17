import { useState, type ReactNode } from 'react';

import { TabSwitcher } from '@/shared/components/TabSwitcher';
import { PageLayout } from '@/shared/components';
import type { LoomWithSupplier } from '@/domain/settings/looms.types';

import { LoomForm } from './LoomForm';
import { LoomList } from './LoomList';
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
      />
    </div>
  );

  return (
    <div className="page-container">
      <PageLayout className="flex-1 h-full">
        {renderTabs()}

        {activeTab === 'looms' && (
          <LoomList onEdit={openEdit} onNew={openCreate} />
        )}

        {activeTab === 'machine_specs' && <MachineSpecList />}
      </PageLayout>

      {showForm && activeTab === 'looms' && (
        <LoomForm loom={editItem} onClose={closeForm} />
      )}
    </div>
  );
}
