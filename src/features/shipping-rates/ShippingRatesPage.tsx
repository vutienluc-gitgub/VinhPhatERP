import { useState } from 'react';

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';

import { ShippingRateForm } from './ShippingRateForm';
import { SHIPPING_RATE_LABELS as MSG } from './shipping-rates.constants';
import { ShippingRateList } from './ShippingRateList';
import type { ShippingRate } from './types';

export function ShippingRatesPage() {
  const [editItem, setEditItem] = useState<ShippingRate | null>(null);
  const [showForm, setShowForm] = useState(false);

  function openCreate() {
    setEditItem(null);
    setShowForm(true);
  }

  function openEdit(item: ShippingRate) {
    setEditItem(item);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditItem(null);
  }

  return (
    <div className="page-container">
      <ShippingRateList onEdit={openEdit} onNew={openCreate} />

      <AdaptiveSheet
        open={showForm}
        onClose={closeForm}
        title={editItem ? MSG.PAGE_TITLE_EDIT : MSG.PAGE_TITLE_ADD}
      >
        <ShippingRateForm item={editItem} onClose={closeForm} />
      </AdaptiveSheet>
    </div>
  );
}
