import React from 'react';
import { Button } from './Button';
import { Plus } from 'lucide-react';

export function AddButton({ onClick, label = 'Thêm mới' }: { onClick?: () => void; label?: string }) {
  return (
    <Button size="sm" icon={<Plus size={16} />} onClick={onClick}>
      {label}
    </Button>
  );
}

export function KpiCard({ title, value, change, icon, subtitle }: any) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1">
      <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
        <span>{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{value}</div>
      {(change || subtitle) && (
        <div className="text-xs text-slate-500">{change ? <span className="text-emerald-600 font-semibold">{change} </span> : null}{subtitle}</div>
      )}
    </div>
  );
}

export function KpiGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{children}</div>;
}

export function KPISection({ children }: { children: React.ReactNode }) {
  return <div className="mb-6">{children}</div>;
}

export function TableSection({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export function PageHeader({ title, subtitle, actions, count }: any) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h1>
          {count !== undefined && <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">{count}</span>}
        </div>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function FilterBar({ filters, activeFilters, onChange, onClear }: any) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      {filters?.map((f: any) => (
        <div key={f.key} className="text-xs">
          <input
            placeholder={f.label}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
            onChange={(e) => onChange?.(f.key, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}

export function VPEntityPicker({ entityType, value, onChange, placeholder = 'Chọn đối tượng...' }: any) {
  return (
    <div className="w-full">
      <input
        type="text"
        placeholder={placeholder}
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      />
    </div>
  );
}

export const StatCard = KpiCard;

export function ActionBar({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl ${className}`}>
      {children}
    </div>
  );
}

export function EmptyState({ title = 'Không có dữ liệu', description, icon, action }: any) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
      {icon && <div className="mb-3 text-slate-400">{icon}</div>}
      <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">{title}</h4>
      {description && <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorInline({ message }: { message?: string }) {
  if (!message) return null;
  return <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/50 rounded-lg border border-red-200 dark:border-red-900">{message}</div>;
}

export function FilterChips({ chips, activeChip, onSelect }: any) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips?.map((c: any) => (
        <button
          key={c.key || c.id}
          type="button"
          onClick={() => onSelect?.(c.key || c.id)}
          className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
            activeChip === (c.key || c.id)
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          {c.label} {c.count !== undefined && <span className="ml-1 opacity-75">({c.count})</span>}
        </button>
      ))}
    </div>
  );
}

export function ClearFilterButton({ onClear, count }: { onClear?: () => void; count?: number }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClear} className="text-xs text-slate-500 hover:text-slate-700">
      Xóa bộ lọc {count ? `(${count})` : ''}
    </Button>
  );
}

export function LiveIndicator({ active = true, label }: { active?: boolean; label?: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-700 dark:text-emerald-400">
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
      {label || (active ? 'Trực tiếp' : 'Ngoại tuyến')}
    </div>
  );
}

export function PageActions({ children }: { children: React.ReactNode }) {




  return <div className="flex items-center gap-2">{children}</div>;
}

export function PageLayout({ children, className = '' }: { children: React.ReactNode; className?: string }) {

  return (
    <div className={`p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in ${className}`}>
      {children}
    </div>
  );
}

export interface FilterFieldConfig {
  key: string;
  label: string;
  type?: string;
  options?: Array<{ value: string; label: string }>;
}
