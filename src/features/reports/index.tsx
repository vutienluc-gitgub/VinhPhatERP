import React, { useState } from 'react';
import type { ERPPlugin } from '@/app/types/plugin';
import { Button } from '@/shared/components/Button';
import { DataTable } from '@/shared/components/DataTable';
import { Badge } from '@/shared/components/Badge';
import { SearchInput } from '@/shared/components/SearchInput';
import { Plus, Download, Filter } from 'lucide-react';

export function ReportsPage() {
  const [search, setSearch] = useState('');
  const [data] = useState([
  {
    "id": "1",
    "title": "Báo cáo Sản lượng Dệt Toàn Nhà Máy",
    "period": "Tháng 08/2026",
    "kpi": "48.5 tấn",
    "growth": 12.4
  },
  {
    "id": "2",
    "title": "Báo cáo Doanh thu Bán Hàng Dệt May",
    "period": "Tháng 08/2026",
    "kpi": "3.8 tỷ ₫",
    "growth": 8.7
  },
  {
    "id": "3",
    "title": "Báo cáo Hiệu suất Máy Dệt (OEE)",
    "period": "Tuần 34",
    "kpi": "87.2%",
    "growth": 3.1
  }
]);

  const filtered = data.filter((item) => 
    Object.values(item).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Báo Cáo Phân Tích Tổng Hợp</h1>
          <p className="text-sm text-slate-500 mt-1">Báo cáo doanh thu, sản lượng dệt, chi phí và tồn kho</p>
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
          
      { header: 'Tên báo cáo', accessorKey: 'title', className: 'font-semibold text-blue-600' },
      { header: 'Kỳ báo cáo', accessorKey: 'period' },
      { header: 'Chỉ số chính', accessorKey: 'kpi' },
      { header: 'Tăng trưởng so cùng kỳ', accessorKey: 'growth', cell: (row: any) => <span className="text-emerald-600 font-bold">+{row.growth}%</span> },
    
        ]}
        data={filtered}
        emptyMessage="Không tìm thấy bản ghi nào"
      />
    </div>
  );
}

export const reportsPlugin: ERPPlugin = {
  key: 'reports',
  label: 'Báo cáo & Phân tích (BI)',
  shortLabel: 'Báo cáo',
  description: 'Báo cáo doanh thu, sản lượng dệt, chi phí và tồn kho',
  icon: 'BarChart2',
  group: 'system',
  order: 75,
  entryPath: '/reports',
  routes: [
    {
      path: '/reports',
      component: () => Promise.resolve({ default: ReportsPage }),
    },
  ],
};

export default reportsPlugin;
