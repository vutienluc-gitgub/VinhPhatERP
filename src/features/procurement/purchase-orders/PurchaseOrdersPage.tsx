import { useState } from 'react';

import { usePurchaseOrderList } from '@/application/purchase-orders';

import { POListTable } from './POListTable';

export function PurchaseOrdersPage() {
  const [filters] = useState({});
  const { data: purchaseOrders = [], isLoading } =
    usePurchaseOrderList(filters);

  return (
    <div className="page-container">
      <POListTable data={purchaseOrders} isLoading={isLoading} />
    </div>
  );
}

export default PurchaseOrdersPage;
