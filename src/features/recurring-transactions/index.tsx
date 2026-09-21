import React, { useState } from 'react';
import type { ERPPlugin } from '@/app/types/plugin';
import { Button } from '@/shared/components/Button';
import { DataTable } from '@/shared/components/DataTable';
import { Badge } from '@/shared/components/Badge';
import { SearchInput } from '@/shared/components/SearchInput';
import { Plus, Download, Filter } from 'lucide-react';

export function RecurringTransactionsPage() {
  const [search, setSearch] = useState('');
  const [data] = useState([
  {
    "id": "1",
    "name": "Tiền điện sản xuất Xưởng Dệt",
    "cycle": "Hàng tháng",
    "amount": 120000000,
    "due_date": "Ngày 15"
  },
  {
    "id": "2",
    "name": "Thuê mặt bằng nhà xưởng Củ Chi",
    "cycle": "Hàng tháng",
    "amount": 65000000,
    "due_date": "Ngày 01"
  }
]);

  const filtered = data.filter((item) => 
    Object.values(item).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Khoản Chi Phí Định Kỳ</h1>
          <p className="text-sm text-slate-500 mt-1">Thu chi định kỳ tiền điện, thuê xưởng, lương công nhân</p>
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
          
      { header: 'Tên khoản mục', accessorKey: 'name' },
      { header: 'Chu kỳ', accessorKey: 'cycle' },
      { header: 'Số tiền ước tính', accessorKey: 'amount', cell: (row: any) => <span>{row.amount.toLocaleString()} ₫</span> },
      { header: 'Ngày đến hạn', accessorKey: 'due_date' },
    
        ]}
        data={filtered}
        emptyMessage="Không tìm thấy bản ghi nào"
      />
    </div>
  );
}

export const recurringTransactionsPlugin: ERPPlugin = {
  key: 'recurring-transactions',
  label: 'Giao dịch định kỳ',
  shortLabel: 'Định kỳ',
  description: 'Thu chi định kỳ tiền điện, thuê xưởng, lương công nhân',
  icon: 'Repeat',
  group: 'system',
  order: 72,
  entryPath: '/recurring-transactions',
  routes: [
    {
      path: '/recurring-transactions',
      component: () => Promise.resolve({ default: RecurringTransactionsPage }),
    },
  ],
};

export default recurringTransactionsPlugin;
