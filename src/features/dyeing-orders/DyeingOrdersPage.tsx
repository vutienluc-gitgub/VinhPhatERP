import { useState } from 'react';

import { useContextualGuide } from '@/features/guide-system/hooks/useContextualGuide';
import { ContextualGuide } from '@/features/guide-system/components/ContextualGuide';
import { PageLayout } from '@/shared/components';
import type { DyeingOrder } from '@/domain/production/dyeing-orders.types';

import { DyeingOrderList } from './DyeingOrderList';
import { DyeingOrderForm } from './DyeingOrderForm';
import { DyeingOrderDetail } from './DyeingOrderDetail';

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
        <PageLayout className="flex-1 h-full">
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
        </PageLayout>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageLayout className="flex-1 h-full">
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
      </PageLayout>
    </div>
  );
}
