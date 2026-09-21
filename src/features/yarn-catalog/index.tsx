import React from 'react';
import type { ERPPlugin } from '@/app/types/plugin';

export function YarnCatalogPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Danh Mục Sợi Dệt</h1>
      <p className="text-slate-500">Chi số sợi Ne 20/1, 30/1, 40/1, Sợi TC, CVC, Poly, DTY...</p>
    </div>
  );
}

export const yarnCatalogPlugin: ERPPlugin = {
  key: 'yarn-catalog',
  label: 'Danh Mục Sợi',
  shortLabel: 'Sợi',
  description: 'Danh mục nguyên liệu sợi',
  icon: 'Layers',
  group: 'master-data',
  order: 75,
  entryPath: '/yarn-catalog',
  routes: [{ path: '/yarn-catalog', component: () => Promise.resolve({ default: YarnCatalogPage }) }],
};
