import { useState } from 'react';

import { usePurchaseOrderListPaginated } from '@/application/purchase-orders';
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination';

import { POListTable } from './POListTable';

export function PurchaseOrdersPage() {
  const [filters] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const { data: result, isLoading } = usePurchaseOrderListPaginated(
    filters,
    page,
    pageSize,
  );

  return (
    <div className="page-container">
      <POListTable
        data={result?.data ?? []}
        isLoading={isLoading}
        pagination={{
          result,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(1);
          },
          itemLabel: 'đơn hàng',
        }}
      />
    </div>
  );
}

export default PurchaseOrdersPage;
