import React, { useState } from 'react';
import type { ERPPlugin } from '@/app/types/plugin';
import { Button } from '@/shared/components/Button';
import { DataTable } from '@/shared/components/DataTable';
import { Badge } from '@/shared/components/Badge';
import { SearchInput } from '@/shared/components/SearchInput';
import { Plus, Download, Filter } from 'lucide-react';

export function InventoryPage() {
  const [search, setSearch] = useState('');
  const [data] = useState([
  {
    "id": "1",
    "category": "Kho Sợi",
    "sku": "YARN-C30-COMB",
    "name": "Sợi Cotton Ne 30/1",
    "qty": "12,400",
    "unit": "kg",
    "alert": "safe"
  },
  {
    "id": "2",
    "category": "Kho Vải Mộc",
    "sku": "RAW-COT-4C",
    "name": "Mộc Cotton 4 Chiều 180g",
    "qty": "8,900",
    "unit": "kg",
    "alert": "safe"
  },
  {
    "id": "3",
    "category": "Hóa chất nhuộm",
    "sku": "CHEM-DYE-BL",
    "name": "Thuốc nhuộm Reactive Blue",
    "qty": "45",
    "unit": "kg",
    "alert": "low"
  }
]);

  const filtered = data.filter((item) => 
    Object.values(item).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Tổng Hợp Tồn Kho Toàn Hệ Thống</h1>
          <p className="text-sm text-slate-500 mt-1">Báo cáo tổng hợp nhập xuất tồn nguyên phụ liệu & thành phẩm</p>
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
          
      { header: 'Phân loại', accessorKey: 'category' },
      { header: 'Mã SKU', accessorKey: 'sku', className: 'font-semibold text-blue-600' },
      { header: 'Tên danh mục', accessorKey: 'name' },
      { header: 'Số lượng tồn', accessorKey: 'qty' },
      { header: 'Đơn vị', accessorKey: 'unit' },
      { header: 'Cảnh báo tồn', accessorKey: 'alert', cell: (row: any) => <Badge variant={row.alert === 'safe' ? 'success' : 'warning'}>{row.alert === 'safe' ? 'An toàn' : 'Sắp hết'}</Badge> },
    
        ]}
        data={filtered}
        emptyMessage="Không tìm thấy bản ghi nào"
      />
    </div>
  );
}

export const inventoryPlugin: ERPPlugin = {
  key: 'inventory',
  label: 'Tổng kho & Tồn trữ',
  shortLabel: 'Tồn kho',
  description: 'Báo cáo tổng hợp nhập xuất tồn nguyên phụ liệu & thành phẩm',
  icon: 'Layers',
  group: 'master-data',
  order: 65,
  entryPath: '/inventory',
  routes: [
    {
      path: '/inventory',
      component: () => Promise.resolve({ default: InventoryPage }),
    },
  ],
};

export default inventoryPlugin;
