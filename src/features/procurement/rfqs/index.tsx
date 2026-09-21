import React, { useState } from 'react';
import type { ERPPlugin } from '@/app/types/plugin';
import { Button } from '@/shared/components/Button';
import { DataTable } from '@/shared/components/DataTable';
import { Badge } from '@/shared/components/Badge';
import { SearchInput } from '@/shared/components/SearchInput';
import { Plus, Download, Filter } from 'lucide-react';

export function RfqsPage() {
  const [search, setSearch] = useState('');
  const [data] = useState([
  {
    "id": "1",
    "code": "RFQ-2026-08",
    "item": "Sợi TC 65/35 Ne 30/1",
    "quotes_received": "3 NCC"
  }
]);

  const filtered = data.filter((item) => 
    Object.values(item).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Yêu Cầu Báo Giá (RFQ)</h1>
          <p className="text-sm text-slate-500 mt-1">Gửi yêu cầu báo giá tới nhà cung ứng</p>
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
          { header: 'Mã RFQ', accessorKey: 'code', className: 'font-semibold text-blue-600' }, { header: 'Mặt hàng cần mua', accessorKey: 'item' }, { header: 'Số lượng NCC phản hồi', accessorKey: 'quotes_received' }
        ]}
        data={filtered}
        emptyMessage="Không tìm thấy bản ghi nào"
      />
    </div>
  );
}

export const rfqsPlugin: ERPPlugin = {
  key: 'rfqs',
  label: 'Chào Giá Nhà Cung Cấp (RFQ)',
  shortLabel: 'Chào Giá RFQ',
  description: 'Gửi yêu cầu báo giá tới nhà cung ứng',
  icon: 'HelpCircle',
  group: 'production',
  order: 37,
  entryPath: '/rfqs',
  routes: [
    {
      path: '/rfqs',
      component: () => Promise.resolve({ default: RfqsPage }),
    },
  ],
};

export default rfqsPlugin;
