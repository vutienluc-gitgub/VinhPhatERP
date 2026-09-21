import React from 'react';
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <div className={'w-10 h-6 rounded-full transition-colors ' + (checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700')}>
        <div className={'w-4 h-4 rounded-full bg-white transition-transform mt-1 ml-1 ' + (checked ? 'translate-x-4' : '')} />
      </div>
      {label && <span className="text-sm">{label}</span>}
    </label>
  );
}
