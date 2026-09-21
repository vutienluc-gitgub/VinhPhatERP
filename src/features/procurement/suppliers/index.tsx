import React, { useState } from 'react';
import type { ERPPlugin } from '@/app/types/plugin';
import { Button } from '@/shared/components/Button';
import { DataTable } from '@/shared/components/DataTable';
import { Badge } from '@/shared/components/Badge';
import { SearchInput } from '@/shared/components/SearchInput';
import { Plus, Download, Filter } from 'lucide-react';

export function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [data] = useState([
  {
    "id": "1",
    "name": "Công ty Cổ phần Sợi Nam Định",
    "category": "Sợi Dệt",
    "phone": "0228 3849 555"
  },
  {
    "id": "2",
    "name": "Hóa Chất Dệt Nhuộm Tân Bình",
    "category": "Hóa chất & Thuốc nhuộm",
    "phone": "028 3812 4567"
  }
]);

  const filtered = data.filter((item) => 
    Object.values(item).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Danh Bạ Nhà Cung Cấp</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý danh bạ nhà cung cấp sợi và hóa chất</p>
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
          { header: 'Tên nhà cung cấp', accessorKey: 'name', className: 'font-semibold text-blue-600' }, { header: 'Ngành hàng', accessorKey: 'category' }, { header: 'Số điện thoại', accessorKey: 'phone' }, { header: 'Đánh giá', accessorKey: 'rating', cell: () => <span>⭐⭐⭐⭐⭐</span> }
        ]}
        data={filtered}
        emptyMessage="Không tìm thấy bản ghi nào"
      />
    </div>
  );
}

export const suppliersPlugin: ERPPlugin = {
  key: 'suppliers',
  label: 'Nhà Cung Cấp',
  shortLabel: 'Nhà Cung Cấp',
  description: 'Quản lý danh bạ nhà cung cấp sợi và hóa chất',
  icon: 'Users',
  group: 'master-data',
  order: 74,
  entryPath: '/suppliers',
  routes: [
    {
      path: '/suppliers',
      component: () => Promise.resolve({ default: SuppliersPage }),
    },
  ],
};

export default suppliersPlugin;
