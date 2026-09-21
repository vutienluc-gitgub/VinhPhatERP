import React from 'react';
export function FilterBar({ children }: { children?: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">{children}</div>;
}
