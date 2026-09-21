import React from 'react';
import type { ERPPlugin } from '@/app/types/plugin';

export function OperationsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Điều Hành Sản Xuất Toàn Nhà Máy</h1>
      <p className="text-slate-500">Bảng điều phối thời gian thực các xưởng dệt, nhuộm, may.</p>
    </div>
  );
}

export const operationsPlugin: ERPPlugin = {
  key: 'operations',
  label: 'Điều Hành Sản Xuất',
  shortLabel: 'Điều hành',
  description: 'Điều phối vận hành xưởng',
  icon: 'Activity',
  group: 'system',
  order: 82,
  entryPath: '/operations',
  routes: [{ path: '/operations', component: () => Promise.resolve({ default: OperationsPage }) }],
};
