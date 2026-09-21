import React, { useState } from 'react';
import type { ERPPlugin } from '@/app/types/plugin';
import { Button } from '@/shared/components/Button';
import { DataTable } from '@/shared/components/DataTable';
import { Badge } from '@/shared/components/Badge';
import { SearchInput } from '@/shared/components/SearchInput';
import { Plus, Download, Filter } from 'lucide-react';

export function OrderKanbanPage() {
  const [search, setSearch] = useState('');
  const [data] = useState([
  {
    "id": "1",
    "stage": "Chờ lên chuyền",
    "count": 4,
    "weight": "12,500"
  },
  {
    "id": "2",
    "stage": "Đang dệt mộc",
    "count": 8,
    "weight": "24,000"
  },
  {
    "id": "3",
    "stage": "Đang nhuộm",
    "count": 5,
    "weight": "15,800"
  },
  {
    "id": "4",
    "stage": "KCS & Đóng gói",
    "count": 3,
    "weight": "9,200"
  }
]);

  const filtered = data.filter((item) => 
    Object.values(item).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Bảng Kanban Đơn hàng</h1>
          <p className="text-sm text-slate-500 mt-1">Theo dõi đơn hàng theo bảng trực quan</p>
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
          
      { header: 'Cột tiến trình', accessorKey: 'stage' },
      { header: 'Số lượng đơn', accessorKey: 'count' },
      { header: 'Tổng khối lượng (kg)', accessorKey: 'weight' },
    
        ]}
        data={filtered}
        emptyMessage="Không tìm thấy bản ghi nào"
      />
    </div>
  );
}

export const orderKanbanPlugin: ERPPlugin = {
  key: 'order-kanban',
  label: 'Kanban Đơn hàng',
  shortLabel: 'Kanban',
  description: 'Theo dõi đơn hàng theo bảng trực quan',
  icon: 'Kanban',
  group: 'sales',
  order: 25,
  entryPath: '/order-kanban',
  routes: [
    {
      path: '/order-kanban',
      component: () => Promise.resolve({ default: OrderKanbanPage }),
    },
  ],
};

export default orderKanbanPlugin;
