import { useState } from 'react';

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';

import { ShippingRateForm } from './ShippingRateForm';
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
        title={editItem ? 'Sửa bảng giá cước' : 'Thêm bảng giá cước'}
      >
        <ShippingRateForm item={editItem} onClose={closeForm} />
      </AdaptiveSheet>
    </div>
  );
}
