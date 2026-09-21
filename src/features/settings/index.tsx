import React, { useState } from 'react';
import type { ERPPlugin } from '@/app/types/plugin';
import { Button } from '@/shared/components/Button';
import { DataTable } from '@/shared/components/DataTable';
import { Badge } from '@/shared/components/Badge';
import { SearchInput } from '@/shared/components/SearchInput';
import { Plus, Download, Filter } from 'lucide-react';

export function SettingsPage() {
  const [search, setSearch] = useState('');
  const [data] = useState([
  {
    "id": "1",
    "setting_name": "Tên Công ty",
    "value": "Công ty CP Dệt May Vĩnh Phát",
    "updated": "20/08/2026"
  },
  {
    "id": "2",
    "setting_name": "Đơn vị tiền tệ",
    "value": "VND (₫)",
    "updated": "20/08/2026"
  },
  {
    "id": "3",
    "setting_name": "Chế độ phê duyệt 2 cấp",
    "value": "Bật (Áp dụng đơn > 100M)",
    "updated": "22/08/2026"
  }
]);

  const filtered = data.filter((item) => 
    Object.values(item).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Cài Đặt Hệ Thống Vĩnh Phát ERP</h1>
          <p className="text-sm text-slate-500 mt-1">Cấu hình doanh nghiệp, phân quyền và mẫu in</p>
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
          
      { header: 'Mục cấu hình', accessorKey: 'setting_name', className: 'font-semibold' },
      { header: 'Giá trị hiện tại', accessorKey: 'value' },
      { header: 'Cập nhật lần cuối', accessorKey: 'updated' },
    
        ]}
        data={filtered}
        emptyMessage="Không tìm thấy bản ghi nào"
      />
    </div>
  );
}

export const settingsPlugin: ERPPlugin = {
  key: 'settings',
  label: 'Cài đặt Hệ thống',
  shortLabel: 'Cài đặt',
  description: 'Cấu hình doanh nghiệp, phân quyền và mẫu in',
  icon: 'Settings',
  group: 'system',
  order: 90,
  entryPath: '/settings',
  routes: [
    {
      path: '/settings',
      component: () => Promise.resolve({ default: SettingsPage }),
    },
  ],
};

export default settingsPlugin;
