import React, { useState } from 'react';
import type { ERPPlugin } from '@/app/types/plugin';
import { Button } from '@/shared/components/Button';
import { DataTable } from '@/shared/components/DataTable';
import { Badge } from '@/shared/components/Badge';
import { SearchInput } from '@/shared/components/SearchInput';
import { Plus, Download, Filter } from 'lucide-react';

export function FinishedFabricPage() {
  const [search, setSearch] = useState('');
  const [data] = useState([
  {
    "id": "1",
    "code": "TP-COT-001",
    "name": "Thun Cotton 100% 4C",
    "color": "Trắng Sứ (White #01)",
    "specs": "1m75 / 185gsm",
    "stock_kg": "1,450",
    "stock_m": "4,500"
  },
  {
    "id": "2",
    "code": "TP-COT-002",
    "name": "Thun Cotton 100% 4C",
    "color": "Đen Tuyển (Black #09)",
    "specs": "1m75 / 185gsm",
    "stock_kg": "2,100",
    "stock_m": "6,400"
  }
]);

  const filtered = data.filter((item) => 
    Object.values(item).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Kho Vải Thành Phẩm</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý cuộn vải thành phẩm sau nhuộm hoàn tất</p>
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
          
      { header: 'Mã cây TP', accessorKey: 'code', className: 'font-semibold text-blue-600' },
      { header: 'Tên hàng', accessorKey: 'name' },
      { header: 'Màu sắc', accessorKey: 'color' },
      { header: 'Khổ / Định lượng', accessorKey: 'specs' },
      { header: 'Tồn kho (kg)', accessorKey: 'stock_kg' },
      { header: 'Tồn kho (mét)', accessorKey: 'stock_m' },
    
        ]}
        data={filtered}
        emptyMessage="Không tìm thấy bản ghi nào"
      />
    </div>
  );
}

export const finishedFabricPlugin: ERPPlugin = {
  key: 'finished-fabric',
  label: 'Kho Vải Thành Phẩm',
  shortLabel: 'Vải TP',
  description: 'Quản lý cuộn vải thành phẩm sau nhuộm hoàn tất',
  icon: 'Archive',
  group: 'production',
  order: 60,
  entryPath: '/finished-fabric',
  routes: [
    {
      path: '/finished-fabric',
      component: () => Promise.resolve({ default: FinishedFabricPage }),
    },
  ],
};

export default finishedFabricPlugin;
