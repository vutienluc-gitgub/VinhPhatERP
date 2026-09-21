import React from 'react';
import { cn } from '@/shared/utils/cn';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export function TabSwitcher({ tabs, activeTab, onChange }: { tabs: TabItem[]; activeTab: string; onChange: (id: string) => void }) {
  return (
    <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2',
            activeTab === t.id
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800">{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
