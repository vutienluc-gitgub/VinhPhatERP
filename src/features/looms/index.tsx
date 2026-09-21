import React, { useState } from 'react';
import type { ERPPlugin } from '@/app/types/plugin';
import { Button } from '@/shared/components/Button';
import { DataTable } from '@/shared/components/DataTable';
import { Badge } from '@/shared/components/Badge';
import { SearchInput } from '@/shared/components/SearchInput';
import { Plus, Download, Filter } from 'lucide-react';

export function LoomsPage() {
  const [search, setSearch] = useState('');
  const [data] = useState([
  {
    "id": "1",
    "code": "MD-01",
    "type": "Máy Dệt Tròn Single Jersey",
    "gauge": "30 inch / 28G",
    "rpm": 28,
    "status": "running"
  },
  {
    "id": "2",
    "code": "MD-02",
    "type": "Máy Dệt Tròn Interlock",
    "gauge": "34 inch / 24G",
    "rpm": 24,
    "status": "running"
  },
  {
    "id": "3",
    "code": "MD-03",
    "type": "Máy Dệt Bo Cổ Rib 1x1",
    "gauge": "18 inch / 14G",
    "rpm": 35,
    "status": "maintenance"
  }
]);

  const filtered = data.filter((item) => 
    Object.values(item).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Danh Mục & Trạng Thái Dàn Máy Dệt</h1>
          <p className="text-sm text-slate-500 mt-1">Danh mục máy dệt tròn, máy dệt kim, trạng thái vận hành</p>
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
          
      { header: 'Mã máy', accessorKey: 'code', className: 'font-semibold text-blue-600' },
      { header: 'Chủng loại', accessorKey: 'type' },
      { header: 'Đường kính / Số kim (Gauge)', accessorKey: 'gauge' },
      { header: 'Tốc độ (Vòng/phút)', accessorKey: 'rpm' },
      { header: 'Trạng thái máy', accessorKey: 'status', cell: (row: any) => <Badge variant={row.status === 'running' ? 'success' : 'warning'}>{row.status === 'running' ? 'Đang chạy' : 'Bảo dưỡng'}</Badge> },
    
        ]}
        data={filtered}
        emptyMessage="Không tìm thấy bản ghi nào"
      />
    </div>
  );
}

export const loomsPlugin: ERPPlugin = {
  key: 'looms',
  label: 'Quản lý Máy dệt (Looms)',
  shortLabel: 'Máy dệt',
  description: 'Danh mục máy dệt tròn, máy dệt kim, trạng thái vận hành',
  icon: 'Cpu',
  group: 'master-data',
  order: 80,
  entryPath: '/looms',
  routes: [
    {
      path: '/looms',
      component: () => Promise.resolve({ default: LoomsPage }),
    },
  ],
};

export const loomPlugin = loomsPlugin;
export default loomsPlugin;

