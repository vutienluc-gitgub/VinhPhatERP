import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { WorkOrderWithRelations } from './types';
import { WorkOrderDetail } from './WorkOrderDetail';
import { WorkOrderForm } from './WorkOrderForm';
import { WorkOrderList } from './WorkOrderList';

export function WorkOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const actionParam = searchParams.get('action');
  const bomIdParam = searchParams.get('bom_id');

  const [view, setView] = useState<'list' | 'detail'>('list');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<WorkOrderWithRelations | null>(
    null,
  );

  // Auto-open form if URL params tell us to cross-link
  useEffect(() => {
    if (actionParam === 'create') {
      setIsFormOpen(true);
      if (bomIdParam) {
        setEditingData({
          bom_template_id: bomIdParam,
          target_quantity: Number(searchParams.get('qty')) || 0,
          weaving_unit_price: Number(searchParams.get('weaving_price')) || 0,
          standard_loss_pct: Number(searchParams.get('loss')) || 0,
        } as unknown as WorkOrderWithRelations);
      }
    }
  }, [actionParam, bomIdParam, searchParams]);

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

  const clearParams = () => {
    if (actionParam || bomIdParam) {
      setSearchParams({});
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingData(null);
    clearParams();
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
    <div className="page-container">
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
            clearParams();
          }}
        />
      )}
    </div>
  );
}
