import React, { useState } from 'react';
import type { ERPPlugin } from '@/app/types/plugin';
import { Button } from '@/shared/components/Button';
import { DataTable } from '@/shared/components/DataTable';
import { Badge } from '@/shared/components/Badge';
import { SearchInput } from '@/shared/components/SearchInput';
import { Plus, Download, Filter } from 'lucide-react';

export function ShipmentsPage() {
  const [search, setSearch] = useState('');
  const [data] = useState([
  {
    "id": "1",
    "code": "SHIP-2026-044",
    "order_code": "SO-2026-089",
    "customer": "May Việt Tiến",
    "driver": "Nguyễn Văn Hải",
    "license_plate": "51C-889.23",
    "status": "shipping"
  },
  {
    "id": "2",
    "code": "SHIP-2026-043",
    "order_code": "SO-2026-090",
    "customer": "An Phước",
    "driver": "Trần Minh Tâm",
    "license_plate": "51D-123.45",
    "status": "delivered"
  }
]);

  const filtered = data.filter((item) => 
    Object.values(item).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Quản lý Giao hàng</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý phiếu xuất kho và lộ trình giao vận</p>
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
          
      { header: 'Mã vận đơn', accessorKey: 'code', className: 'font-semibold text-blue-600' },
      { header: 'Đơn hàng', accessorKey: 'order_code' },
      { header: 'Khách hàng', accessorKey: 'customer' },
      { header: 'Tài xế', accessorKey: 'driver' },
      { header: 'Biển số', accessorKey: 'license_plate' },
      { header: 'Trạng thái', accessorKey: 'status', cell: (row: any) => <Badge variant={row.status === 'delivered' ? 'success' : 'info'}>{row.status === 'delivered' ? 'Đã giao' : 'Đang chuyển'}</Badge> },
    
        ]}
        data={filtered}
        emptyMessage="Không tìm thấy bản ghi nào"
      />
    </div>
  );
}

export const shipmentsPlugin: ERPPlugin = {
  key: 'shipments',
  label: 'Giao hàng & Vận chuyển',
  shortLabel: 'Giao hàng',
  description: 'Quản lý phiếu xuất kho và lộ trình giao vận',
  icon: 'Truck',
  group: 'sales',
  order: 35,
  entryPath: '/shipments',
  routes: [
    {
      path: '/shipments',
      component: () => Promise.resolve({ default: ShipmentsPage }),
    },
  ],
};

export default shipmentsPlugin;
