import { useState } from 'react';

import { usePurchaseOrderList } from '@/application/purchase-orders';

import { POListTable } from './POListTable';

export function PurchaseOrdersPage() {
  const [filters] = useState({});
  const { data: purchaseOrders = [], isLoading } =
    usePurchaseOrderList(filters);

  return (
    <div className="page-container p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold m-0">Quản lý Đơn Đặt Hàng (PO)</h1>
        <p className="text-muted mt-1">
          Danh sách tất cả các đơn đặt mua nguyên liệu
        </p>
      </div>

      <POListTable data={purchaseOrders} isLoading={isLoading} />
    </div>
  );
}
