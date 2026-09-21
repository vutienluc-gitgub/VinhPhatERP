import React, { useState } from 'react';
import type { ERPPlugin } from '@/app/types/plugin';
import { Button } from '@/shared/components/Button';
import { DataTable } from '@/shared/components/DataTable';
import { Badge } from '@/shared/components/Badge';
import { SearchInput } from '@/shared/components/SearchInput';
import { Plus, Download, Filter } from 'lucide-react';

export function PurchaseOrdersPage() {
  const [search, setSearch] = useState('');
  const [data] = useState([
  {
    "id": "1",
    "code": "PO-2026-01",
    "supplier": "Sợi Nam Định",
    "total": 420000000,
    "status": "Đã phát hành"
  }
]);

  const filtered = data.filter((item) => 
    Object.values(item).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Đơn Đặt Mua Hàng</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý đơn đặt hàng sợi và hóa chất</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Download size={16} />}>
            Xuất Excel
          </Button>
          <Button size="sm" icon={<Plus size={16} />}>
            Tạo mới
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="w-full sm:w-80">
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm nhanh..." />
        </div>
        <Button variant="outline" size="sm" icon={<Filter size={16} />}>
          Bộ lọc nâng cao
        </Button>
      </div>

      <DataTable
        columns={[
          { header: 'Mã PO', accessorKey: 'code', className: 'font-semibold text-blue-600' }, { header: 'Nhà cung cấp', accessorKey: 'supplier' }, { header: 'Tổng tiền', accessorKey: 'total', cell: (r: any) => <span>{r.total.toLocaleString()} ₫</span> }, { header: 'Trạng thái', accessorKey: 'status', cell: (r: any) => <Badge variant="primary">{r.status}</Badge> }
        ]}
        data={filtered}
        emptyMessage="Không tìm thấy bản ghi nào"
      />
    </div>
  );
}

export const purchaseOrdersPlugin: ERPPlugin = {
  key: 'purchase-orders',
  label: 'Đơn Mua Hàng (PO)',
  shortLabel: 'PO Mua Hàng',
  description: 'Quản lý đơn đặt hàng sợi và hóa chất',
  icon: 'ShoppingBag',
  group: 'production',
  order: 38,
  entryPath: '/purchase-orders',
  routes: [
    {
      path: '/purchase-orders',
      component: () => Promise.resolve({ default: PurchaseOrdersPage }),
    },
  ],
};

export default purchaseOrdersPlugin;
