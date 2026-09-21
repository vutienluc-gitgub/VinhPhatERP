import React, { useState } from 'react';
import type { ERPPlugin } from '@/app/types/plugin';
import { Button } from '@/shared/components/Button';
import { DataTable } from '@/shared/components/DataTable';
import { Badge } from '@/shared/components/Badge';
import { SearchInput } from '@/shared/components/SearchInput';
import { Plus, Download, Filter } from 'lucide-react';

export function OrdersPage() {
  const [search, setSearch] = useState('');
  const [data] = useState([
  {
    "id": "1",
    "code": "SO-2026-089",
    "customer": "May Việt Tiến",
    "item": "Cotton Single 100%",
    "quantity": "5,000 m",
    "amount": 350000000,
    "progress": 65,
    "status": "Đang dệt"
  },
  {
    "id": "2",
    "code": "SO-2026-090",
    "customer": "Thời Trang An Phước",
    "item": "Thun Cá Mập TC",
    "quantity": "3,000 m",
    "amount": 210000000,
    "progress": 100,
    "status": "Đã hoàn thành"
  }
]);

  const filtered = data.filter((item) => 
    Object.values(item).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Quản lý Đơn hàng</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý đơn hàng sản xuất và bán hàng</p>
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
          
      { header: 'Mã đơn', accessorKey: 'code', className: 'font-semibold text-blue-600' },
      { header: 'Khách hàng', accessorKey: 'customer' },
      { header: 'Sản phẩm', accessorKey: 'item' },
      { header: 'Số lượng', accessorKey: 'quantity' },
      { header: 'Giá trị', accessorKey: 'amount', cell: (row: any) => <span>{row.amount.toLocaleString()} ₫</span> },
      { header: 'Tiến độ', accessorKey: 'progress', cell: (row: any) => <span className="font-medium text-emerald-600">{row.progress}%</span> },
      { header: 'Trạng thái', accessorKey: 'status', cell: (row: any) => <Badge variant="primary">{row.status}</Badge> },
    
        ]}
        data={filtered}
        emptyMessage="Không tìm thấy bản ghi nào"
      />
    </div>
  );
}

export const ordersPlugin: ERPPlugin = {
  key: 'orders',
  label: 'Đơn hàng (Sales Orders)',
  shortLabel: 'Đơn hàng',
  description: 'Quản lý đơn hàng sản xuất và bán hàng',
  icon: 'ShoppingBag',
  group: 'sales',
  order: 20,
  entryPath: '/orders',
  routes: [
    {
      path: '/orders',
      component: () => Promise.resolve({ default: OrdersPage }),
    },
  ],
};

export default ordersPlugin;
