import React, { useState } from 'react';
import type { ERPPlugin } from '@/app/types/plugin';
import { Button } from '@/shared/components/Button';
import { DataTable } from '@/shared/components/DataTable';
import { Badge } from '@/shared/components/Badge';
import { SearchInput } from '@/shared/components/SearchInput';
import { Plus, Download, Filter } from 'lucide-react';

export function PurchaseRequestsPage() {
  const [search, setSearch] = useState('');
  const [data] = useState([
  {
    "id": "1",
    "code": "PR-2026-04",
    "dept": "Xưởng Dệt Tròn",
    "item": "Kim Dệt Groz-Beckert 28G",
    "status": "Chờ duyệt"
  }
]);

  const filtered = data.filter((item) => 
    Object.values(item).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Yêu Cầu Mua Hàng</h1>
          <p className="text-sm text-slate-500 mt-1">Đề xuất vật tư từ xưởng sản xuất</p>
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
          { header: 'Mã PR', accessorKey: 'code', className: 'font-semibold text-blue-600' }, { header: 'Bộ phận đề xuất', accessorKey: 'dept' }, { header: 'Vật tư', accessorKey: 'item' }, { header: 'Trạng thái', accessorKey: 'status', cell: (r: any) => <Badge variant="warning">{r.status}</Badge> }
        ]}
        data={filtered}
        emptyMessage="Không tìm thấy bản ghi nào"
      />
    </div>
  );
}

export const purchaseRequestsPlugin: ERPPlugin = {
  key: 'purchase-requests',
  label: 'Yêu Cầu Mua Hàng (PR)',
  shortLabel: 'Yêu Cầu Mua',
  description: 'Đề xuất vật tư từ xưởng sản xuất',
  icon: 'ClipboardList',
  group: 'production',
  order: 36,
  entryPath: '/purchase-requests',
  routes: [
    {
      path: '/purchase-requests',
      component: () => Promise.resolve({ default: PurchaseRequestsPage }),
    },
  ],
};

export default purchaseRequestsPlugin;
