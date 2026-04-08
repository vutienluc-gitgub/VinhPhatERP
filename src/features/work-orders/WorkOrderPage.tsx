import { useState } from 'react';

import type { WorkOrderWithRelations } from './types';
import { WorkOrderDetail } from './WorkOrderDetail';
import { WorkOrderForm } from './WorkOrderForm';
import { WorkOrderList } from './WorkOrderList';

export function WorkOrdersPage() {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<WorkOrderWithRelations | null>(
    null,
  );

  const handleView = (id: string) => {
    setSelectedId(id);
    setView('detail');
  };

  const handleBack = () => {
    setView('list');
    setSelectedId(null);
    setEditingData(null);
  };

  const handleEdit = (wo: WorkOrderWithRelations) => {
    setEditingData(wo);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingData(null);
  };

  if (view === 'detail' && selectedId) {
    return (
      <WorkOrderDetail
        id={selectedId}
        onBack={handleBack}
        onEdit={handleEdit}
      />
    );
  }

  return (
    <>
      <WorkOrderList
        onView={handleView}
        onEdit={handleEdit}
        onCreate={() => setIsFormOpen(true)}
      />

      {/* Work Order Form Modal */}
      {isFormOpen && (
        <WorkOrderForm
          initialData={editingData ?? undefined}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingData(null);
          }}
        />
      )}
    </>
  );
}
