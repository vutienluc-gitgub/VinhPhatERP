import React, { useState } from 'react';
import type { ERPPlugin } from '@/app/types/plugin';
import { Button } from '@/shared/components/Button';
import { DataTable } from '@/shared/components/DataTable';
import { Badge } from '@/shared/components/Badge';
import { SearchInput } from '@/shared/components/SearchInput';
import { Plus, Download, Filter } from 'lucide-react';

export function WeavingInvoicesPage() {
  const [search, setSearch] = useState('');
  const [data] = useState([
  {
    "id": "1",
    "code": "DS-DET-019",
    "contractor": "Xưởng Dệt Thành Công",
    "weight": "8,200",
    "unit_price": 12000,
    "total": 98400000
  }
]);

  const filtered = data.filter((item) => 
    Object.values(item).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Đối soát Gia công Dệt</h1>
          <p className="text-sm text-slate-500 mt-1">Hóa đơn và đối soát công dệt vệ tinh</p>
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
          
      { header: 'Mã đối soát', accessorKey: 'code', className: 'font-semibold text-blue-600' },
      { header: 'Xưởng vệ tinh', accessorKey: 'contractor' },
      { header: 'Sản lượng (kg)', accessorKey: 'weight' },
      { header: 'Đơn giá', accessorKey: 'unit_price', cell: (row: any) => <span>{row.unit_price.toLocaleString()} ₫/kg</span> },
      { header: 'Thành tiền', accessorKey: 'total', cell: (row: any) => <span className="font-semibold text-emerald-600">{row.total.toLocaleString()} ₫</span> },
    
        ]}
        data={filtered}
        emptyMessage="Không tìm thấy bản ghi nào"
      />
    </div>
  );
}

export const weavingInvoicesPlugin: ERPPlugin = {
  key: 'weaving-invoices',
  label: 'Gia công Dệt (Gia công)',
  shortLabel: 'GC Dệt',
  description: 'Hóa đơn và đối soát công dệt vệ tinh',
  icon: 'Receipt',
  group: 'production',
  order: 55,
  entryPath: '/weaving-invoices',
  routes: [
    {
      path: '/weaving-invoices',
      component: () => Promise.resolve({ default: WeavingInvoicesPage }),
    },
  ],
};

export default weavingInvoicesPlugin;
