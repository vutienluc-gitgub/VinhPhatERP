import React from 'react';
import type { ERPPlugin } from '@/app/types/plugin';

export function GuidePage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Hướng Dẫn Vận Hành Hệ Thống</h1>
      <p className="text-slate-500">Tài liệu quy trình chuẩn (SOP) cho các phòng ban.</p>
    </div>
  );
}

export const guidePlugin: ERPPlugin = {
  key: 'guide-system',
  label: 'Hướng dẫn sử dụng',
  shortLabel: 'Hướng dẫn',
  description: 'Quy trình và tài liệu',
  icon: 'HelpCircle',
  group: 'system',
  order: 95,
  entryPath: '/guide',
  routes: [{ path: '/guide', component: () => Promise.resolve({ default: GuidePage }) }],
};
