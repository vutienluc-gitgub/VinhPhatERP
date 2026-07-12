import { useState } from 'react';

import { useContextualGuide } from '@/features/guide-system/hooks/useContextualGuide';
import { ContextualGuide } from '@/features/guide-system/components/ContextualGuide';

import { DyeingOrderList } from './DyeingOrderList';
import { DyeingOrderForm } from './DyeingOrderForm';
import { DyeingOrderDetail } from './DyeingOrderDetail';
import type { DyeingOrder } from './types';

export function DyeingOrdersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<DyeingOrder | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { activeGuides } = useContextualGuide(
    'DyeingOrders',
    selectedId || undefined,
  );

  if (selectedId) {
    return (
      <div className="page-container">
        <DyeingOrderDetail
          orderId={selectedId}
          onBack={() => setSelectedId(null)}
          onEdit={(order) => {
            setEditingOrder(order);
            setIsFormOpen(true);
          }}
        />

        <DyeingOrderForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          editingOrder={editingOrder}
        />

        <ContextualGuide activeGuides={activeGuides} />
      </div>
    );
  }

  return (
    <>
      <DyeingOrderList
        onView={(id) => setSelectedId(id)}
        onEdit={(order) => {
          setEditingOrder(order);
          setIsFormOpen(true);
        }}
      />

      <DyeingOrderForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        editingOrder={editingOrder}
      />

      <ContextualGuide activeGuides={activeGuides} />
    </>
  );
}
