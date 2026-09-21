import React, { useState } from 'react';
import type { ERPPlugin } from '@/app/types/plugin';
import { Button } from '@/shared/components/Button';
import { DataTable } from '@/shared/components/DataTable';
import { Badge } from '@/shared/components/Badge';
import { SearchInput } from '@/shared/components/SearchInput';
import { Plus, Download, Filter } from 'lucide-react';

export function YarnReceiptsPage() {
  const [search, setSearch] = useState('');
  const [data] = useState([
  {
    "id": "1",
    "code": "PN-SOI-001",
    "supplier": "Sợi Nam Định",
    "yarn_type": "Cotton Ne 30/1 Combed",
    "weight": "5,400",
    "lot_number": "LOT-ND-2026A",
    "date": "27/08/2026"
  },
  {
    "id": "2",
    "code": "PN-SOI-002",
    "supplier": "Sợi Huế",
    "yarn_type": "Polyester Ne 40/1 DTY",
    "weight": "3,200",
    "lot_number": "LOT-HUE-992",
    "date": "28/08/2026"
  }
]);

  const filtered = data.filter((item) => 
    Object.values(item).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Phiếu Nhập Kho Sợi</h1>
          <p className="text-sm text-slate-500 mt-1">Phiếu nhập kho nguyên liệu sợi từ nhà cung cấp</p>
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
          
      { header: 'Số phiếu', accessorKey: 'code', className: 'font-semibold text-blue-600' },
      { header: 'Nhà cung cấp', accessorKey: 'supplier' },
      { header: 'Loại sợi', accessorKey: 'yarn_type' },
      { header: 'Số lượng (kg)', accessorKey: 'weight' },
      { header: 'Lô sản xuất', accessorKey: 'lot_number' },
      { header: 'Ngày nhập', accessorKey: 'date' },
    
        ]}
        data={filtered}
        emptyMessage="Không tìm thấy bản ghi nào"
      />
    </div>
  );
}

export const yarnReceiptsPlugin: ERPPlugin = {
  key: 'yarn-receipts',
  label: 'Nhập kho Sợi',
  shortLabel: 'Nhập Sợi',
  description: 'Phiếu nhập kho nguyên liệu sợi từ nhà cung cấp',
  icon: 'Layers',
  group: 'production',
  order: 40,
  entryPath: '/yarn-receipts',
  routes: [
    {
      path: '/yarn-receipts',
      component: () => Promise.resolve({ default: YarnReceiptsPage }),
    },
  ],
};

export default yarnReceiptsPlugin;
