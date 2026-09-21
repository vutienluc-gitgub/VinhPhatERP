import React, { useState } from 'react';
import type { ERPPlugin } from '@/app/types/plugin';
import { Button } from '@/shared/components/Button';
import { DataTable } from '@/shared/components/DataTable';
import { Badge } from '@/shared/components/Badge';
import { SearchInput } from '@/shared/components/SearchInput';
import { Plus, Download, Filter } from 'lucide-react';

export function RawFabricPage() {
  const [search, setSearch] = useState('');
  const [data] = useState([
  {
    "id": "1",
    "roll_code": "MOC-2026-0982",
    "fabric": "Cotton 4 Chiều Mộc",
    "weight": "24.5",
    "loom": "MD-04",
    "location": "Kệ A-02"
  },
  {
    "id": "2",
    "roll_code": "MOC-2026-0983",
    "fabric": "Cotton 4 Chiều Mộc",
    "weight": "25.1",
    "loom": "MD-04",
    "location": "Kệ A-02"
  }
]);

  const filtered = data.filter((item) => 
    Object.values(item).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Quản lý Cây Vải Mộc</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý cây vải mộc sau khi hạ máy dệt</p>
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
          
      { header: 'Mã cây', accessorKey: 'roll_code', className: 'font-semibold text-blue-600' },
      { header: 'Loại vải mộc', accessorKey: 'fabric' },
      { header: 'Trọng lượng (kg)', accessorKey: 'weight' },
      { header: 'Máy dệt', accessorKey: 'loom' },
      { header: 'KCS Mộc', accessorKey: 'kcs_status', cell: (row: any) => <Badge variant="success">Loại 1 (A)</Badge> },
      { header: 'Vị trí kệ', accessorKey: 'location' },
    
        ]}
        data={filtered}
        emptyMessage="Không tìm thấy bản ghi nào"
      />
    </div>
  );
}

export const rawFabricPlugin: ERPPlugin = {
  key: 'raw-fabric',
  label: 'Kho Mộc (Raw Fabric)',
  shortLabel: 'Kho Mộc',
  description: 'Quản lý cây vải mộc sau khi hạ máy dệt',
  icon: 'Package',
  group: 'production',
  order: 50,
  entryPath: '/raw-fabric',
  routes: [
    {
      path: '/raw-fabric',
      component: () => Promise.resolve({ default: RawFabricPage }),
    },
  ],
};

export default rawFabricPlugin;
