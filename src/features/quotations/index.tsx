import React, { useState } from 'react';
import type { ERPPlugin } from '@/app/types/plugin';
import { Button } from '@/shared/components/Button';
import { DataTable } from '@/shared/components/DataTable';
import { Badge } from '@/shared/components/Badge';
import { SearchInput } from '@/shared/components/SearchInput';
import { Plus, Download, Filter } from 'lucide-react';

export function QuotationsPage() {
  const [search, setSearch] = useState('');
  const [data] = useState([
  {
    "id": "1",
    "code": "BG-2026-001",
    "customer": "May Việt Tiến",
    "fabric": "Vải Cotton 100% 4c",
    "qty": 5000,
    "total": 275000000,
    "status": "approved",
    "created_at": "28/08/2026"
  },
  {
    "id": "2",
    "code": "BG-2026-002",
    "customer": "Phong Phú",
    "fabric": "Vải Cá Sấu CVC",
    "qty": 2000,
    "total": 110000000,
    "status": "pending",
    "created_at": "29/08/2026"
  }
]);

  const filtered = data.filter((item) => 
    Object.values(item).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Danh sách Báo giá</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý báo giá dệt may và duyệt giá</p>
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
          
      { header: 'Mã báo giá', accessorKey: 'code', className: 'font-semibold text-blue-600' },
      { header: 'Khách hàng', accessorKey: 'customer' },
      { header: 'Loại vải', accessorKey: 'fabric' },
      { header: 'Số lượng (m)', accessorKey: 'qty' },
      { header: 'Tổng tiền', accessorKey: 'total', cell: (row: any) => <span>{row.total.toLocaleString()} ₫</span> },
      { header: 'Trạng thái', accessorKey: 'status', cell: (row: any) => <Badge variant={row.status === 'approved' ? 'success' : 'warning'}>{row.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}</Badge> },
      { header: 'Ngày tạo', accessorKey: 'created_at' },
    
        ]}
        data={filtered}
        emptyMessage="Không tìm thấy bản ghi nào"
      />
    </div>
  );
}

export const quotationsPlugin: ERPPlugin = {
  key: 'quotations',
  label: 'Báo giá & Đề xuất',
  shortLabel: 'Báo giá',
  description: 'Quản lý báo giá dệt may và duyệt giá',
  icon: 'FileText',
  group: 'sales',
  order: 10,
  entryPath: '/quotations',
  routes: [
    {
      path: '/quotations',
      component: () => Promise.resolve({ default: QuotationsPage }),
    },
  ],
};

export default quotationsPlugin;
