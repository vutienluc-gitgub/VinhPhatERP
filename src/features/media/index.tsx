import React, { useState } from 'react';
import type { ERPPlugin } from '@/app/types/plugin';
import { Button } from '@/shared/components/Button';
import { DataTable } from '@/shared/components/DataTable';
import { Badge } from '@/shared/components/Badge';
import { SearchInput } from '@/shared/components/SearchInput';
import { Plus, Download, Filter } from 'lucide-react';

export function MediaPage() {
  const [search, setSearch] = useState('');
  const [data] = useState([
  {
    "id": "1",
    "name": "Catalogue_Vai_Mua_Thu_2026.pdf",
    "ext": "PDF",
    "size": "14.2 MB",
    "uploader": "Nguyễn Thu Trang"
  },
  {
    "id": "2",
    "name": "Mau_Vai_Cotton_Combed_Swatches.jpg",
    "ext": "JPEG",
    "size": "3.8 MB",
    "uploader": "Vũ Tiến Lực"
  }
]);

  const filtered = data.filter((item) => 
    Object.values(item).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Thư Viện Tệp & Tài Liệu</h1>
          <p className="text-sm text-slate-500 mt-1">Hình ảnh mẫu vải, tài liệu kỹ thuật và file đính kèm</p>
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
          
      { header: 'Tên file', accessorKey: 'name', className: 'font-semibold text-blue-600' },
      { header: 'Định dạng', accessorKey: 'ext' },
      { header: 'Dung lượng', accessorKey: 'size' },
      { header: 'Người tải lên', accessorKey: 'uploader' },
    
        ]}
        data={filtered}
        emptyMessage="Không tìm thấy bản ghi nào"
      />
    </div>
  );
}

export const mediaPlugin: ERPPlugin = {
  key: 'media',
  label: 'Thư viện Media & Tài liệu',
  shortLabel: 'Media',
  description: 'Hình ảnh mẫu vải, tài liệu kỹ thuật và file đính kèm',
  icon: 'Image',
  group: 'system',
  order: 85,
  entryPath: '/media',
  routes: [
    {
      path: '/media',
      component: () => Promise.resolve({ default: MediaPage }),
    },
  ],
};

export default mediaPlugin;
