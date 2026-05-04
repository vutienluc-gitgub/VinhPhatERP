import { useState } from 'react';

import { FAB } from '@/shared/components';
import { TabSwitcher } from '@/shared/components/TabSwitcher';

import { RawFabricBulkForm } from './RawFabricBulkForm';
import { RawFabricForm } from './RawFabricForm';
import { RawFabricList } from './RawFabricList';
import type { RawFabricRoll } from './types';

const TABS = [
  { key: 'inventory', label: 'Tồn kho' },
  { key: 'receipts', label: 'Phiếu nhập' },
  { key: 'issues', label: 'Phiếu xuất' },
];

export function RawFabricPage() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [editRoll, setEditRoll] = useState<RawFabricRoll | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);

  function openCreate() {
    setEditRoll(null);
    setShowForm(true);
  }

  function openEdit(roll: RawFabricRoll) {
    setEditRoll(roll);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditRoll(null);
  }

  return (
    <div className="flex flex-col h-full bg-surface-subtle min-w-0 overflow-x-hidden">
      {/* --- TOP SEGMENT TABS --- */}
      <div className="sticky top-0 z-30 px-4 py-2 bg-surface-strong border-b border-border shadow-sm min-w-0">
        <TabSwitcher tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      {/* --- CONTENT AREA (Cần pb-24 để không bị lấp bởi FAB) --- */}
      <div className="flex-1 overflow-y-auto pb-24 p-2 sm:p-4 min-w-0">
        {activeTab === 'inventory' && (
          <RawFabricList
            onEdit={openEdit}
            onNew={openCreate}
            onBulkNew={() => setShowBulkForm(true)}
          />
        )}

        {activeTab === 'receipts' && (
          <div className="flex-center h-40 text-muted flex-col gap-2">
            <span>Tính năng Phiếu nhập đang phát triển...</span>
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="flex-center h-40 text-muted flex-col gap-2">
            <span>Tính năng Phiếu xuất đang phát triển...</span>
          </div>
        )}
      </div>

      {showForm && <RawFabricForm roll={editRoll} onClose={closeForm} />}
      {showBulkForm && (
        <RawFabricBulkForm onClose={() => setShowBulkForm(false)} />
      )}

      {/* --- FLOATING ACTION BUTTON --- */}
      <FAB
        icon={activeTab === 'inventory' ? 'Plus' : 'FileText'}
        onClick={() => {
          if (activeTab === 'inventory') {
            // Mặc định mở form nhập lô (Bulk) vì mộc thường nhập theo lô
            setShowBulkForm(true);
          } else {
            alert('Tính năng đang phát triển');
          }
        }}
      />
    </div>
  );
}
