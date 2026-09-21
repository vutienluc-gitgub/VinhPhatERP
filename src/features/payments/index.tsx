import React, { useState } from 'react';
import type { ERPPlugin } from '@/app/types/plugin';
import { Button } from '@/shared/components/Button';
import { DataTable } from '@/shared/components/DataTable';
import { Badge } from '@/shared/components/Badge';
import { SearchInput } from '@/shared/components/SearchInput';
import { Plus, Download, Filter } from 'lucide-react';

export function PaymentsPage() {
  const [search, setSearch] = useState('');
  const [data] = useState([
  {
    "id": "1",
    "code": "PT-2026-101",
    "type": "income",
    "partner": "May Việt Tiến",
    "amount": 150000000,
    "method": "Chuyển khoản VCB",
    "date": "28/08/2026"
  },
  {
    "id": "2",
    "code": "PC-2026-088",
    "type": "expense",
    "partner": "Sợi Nam Định",
    "amount": 84000000,
    "method": "Chuyển khoản BIDV",
    "date": "27/08/2026"
  }
]);

  const filtered = data.filter((item) => 
    Object.values(item).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Quản Lý Thu Chi & Tài Chính</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý thu tiền khách hàng và thanh toán nhà cung cấp</p>
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
          
      { header: 'Mã phiếu', accessorKey: 'code', className: 'font-semibold text-blue-600' },
      { header: 'Loại giao dịch', accessorKey: 'type', cell: (row: any) => <Badge variant={row.type === 'income' ? 'success' : 'danger'}>{row.type === 'income' ? 'Thu tiền' : 'Chi tiền'}</Badge> },
      { header: 'Đối tác', accessorKey: 'partner' },
      { header: 'Số tiền', accessorKey: 'amount', cell: (row: any) => <span className="font-semibold">{row.amount.toLocaleString()} ₫</span> },
      { header: 'Phương thức', accessorKey: 'method' },
      { header: 'Ngày GD', accessorKey: 'date' },
    
        ]}
        data={filtered}
        emptyMessage="Không tìm thấy bản ghi nào"
      />
    </div>
  );
}

export const paymentsPlugin: ERPPlugin = {
  key: 'payments',
  label: 'Thu chi & Sổ quỹ',
  shortLabel: 'Tài chính',
  description: 'Quản lý thu tiền khách hàng và thanh toán nhà cung cấp',
  icon: 'CreditCard',
  group: 'system',
  order: 70,
  entryPath: '/payments',
  routes: [
    {
      path: '/payments',
      component: () => Promise.resolve({ default: PaymentsPage }),
    },
  ],
};

export function DebtsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Quản Lý Công Nợ Đối Tác</h1>
      <p className="text-slate-500">Đối soát công nợ khách hàng và nhà cung ứng theo thời gian thực.</p>
    </div>
  );
}

export const debtsPlugin: ERPPlugin = {
  key: 'debts',
  label: 'Quản lý Công nợ',
  shortLabel: 'Công nợ',
  description: 'Theo dõi công nợ khách hàng & nhà cung cấp',
  icon: 'DollarSign',
  group: 'system',
  order: 71,
  entryPath: '/debts',
  routes: [
    {
      path: '/debts',
      component: () => Promise.resolve({ default: DebtsPage }),
    },
  ],
};

export default paymentsPlugin;

