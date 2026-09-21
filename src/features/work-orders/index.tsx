import React, { useState } from 'react';
import type { ERPPlugin } from '@/app/types/plugin';
import { Button } from '@/shared/components/Button';
import { DataTable } from '@/shared/components/DataTable';
import { Badge } from '@/shared/components/Badge';
import { SearchInput } from '@/shared/components/SearchInput';
import { Plus, Download, Filter } from 'lucide-react';

export function WorkOrdersPage() {
  const [search, setSearch] = useState('');
  const [data] = useState([
  {
    "id": "1",
    "code": "WO-2026-112",
    "loom": "Máy Dệt Tròn #04",
    "product": "Vải Cotton 4C 180gsm",
    "target": "2,500",
    "actual": "1,840",
    "status": "Đang chạy"
  },
  {
    "id": "2",
    "code": "WO-2026-113",
    "loom": "Máy Dệt Tròn #09",
    "product": "Vải Cá Sấu CVC 220gsm",
    "target": "1,800",
    "actual": "1,800",
    "status": "Hoàn thành"
  }
]);

  const filtered = data.filter((item) => 
    Object.values(item).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Lệnh Sản Xuất</h1>
          <p className="text-sm text-slate-500 mt-1">Điều phối ca kíp, máy dệt và chỉ thị dệt</p>
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
          
      { header: 'Mã lệnh', accessorKey: 'code', className: 'font-semibold text-blue-600' },
      { header: 'Mã máy dệt', accessorKey: 'loom' },
      { header: 'Mặt hàng', accessorKey: 'product' },
      { header: 'Kế hoạch (kg)', accessorKey: 'target' },
      { header: 'Thực đạt (kg)', accessorKey: 'actual' },
      { header: 'Trạng thái', accessorKey: 'status', cell: (row: any) => <Badge variant="primary">{row.status}</Badge> },
    
        ]}
        data={filtered}
        emptyMessage="Không tìm thấy bản ghi nào"
      />
    </div>
  );
}

export const workOrdersPlugin: ERPPlugin = {
  key: 'work-orders',
  label: 'Lệnh sản xuất (WO)',
  shortLabel: 'Lệnh SX',
  description: 'Điều phối ca kíp, máy dệt và chỉ thị dệt',
  icon: 'Cpu',
  group: 'production',
  order: 45,
  entryPath: '/work-orders',
  routes: [
    {
      path: '/work-orders',
      component: () => Promise.resolve({ default: WorkOrdersPage }),
    },
  ],
};

export default workOrdersPlugin;
