import React, { useState } from 'react';
import type { ERPPlugin } from '@/app/types/plugin';
import { Button } from '@/shared/components/Button';
import { DataTable } from '@/shared/components/DataTable';
import { Badge } from '@/shared/components/Badge';
import { SearchInput } from '@/shared/components/SearchInput';
import { Plus, Download, Filter } from 'lucide-react';

export function ShippingRatesPage() {
  const [search, setSearch] = useState('');
  const [data] = useState([
  {
    "id": "1",
    "route": "Củ Chi -> Tân Bình (Nội thành)",
    "capacity": "Xe 2.5 Tấn",
    "price": 650000
  },
  {
    "id": "2",
    "route": "Củ Chi -> Bình Dương (KCN VSIP)",
    "capacity": "Xe 5.0 Tấn",
    "price": 1200000
  }
]);

  const filtered = data.filter((item) => 
    Object.values(item).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Biểu Cước Vận Chuyển</h1>
          <p className="text-sm text-slate-500 mt-1">Cài đặt đơn giá cước vận chuyển theo cung đường và tải trọng</p>
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
          
      { header: 'Tuyến đường', accessorKey: 'route' },
      { header: 'Tải trọng xe', accessorKey: 'capacity' },
      { header: 'Đơn giá / Chuyến', accessorKey: 'price', cell: (row: any) => <span>{row.price.toLocaleString()} ₫</span> },
    
        ]}
        data={filtered}
        emptyMessage="Không tìm thấy bản ghi nào"
      />
    </div>
  );
}

export const shippingRatesPlugin: ERPPlugin = {
  key: 'shipping-rates',
  label: 'Biểu phí Vận chuyển',
  shortLabel: 'Phí Vận chuyển',
  description: 'Cài đặt đơn giá cước vận chuyển theo cung đường và tải trọng',
  icon: 'Compass',
  group: 'system',
  order: 78,
  entryPath: '/shipping-rates',
  routes: [
    {
      path: '/shipping-rates',
      component: () => Promise.resolve({ default: ShippingRatesPage }),
    },
  ],
};

export default shippingRatesPlugin;
