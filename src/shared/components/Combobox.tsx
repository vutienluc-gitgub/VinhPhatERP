import React from 'react';
import { cn } from '@/shared/utils/cn';

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export function Combobox({ options, value, onChange, placeholder = 'Chọn...', className }: ComboboxProps) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
      className={cn(
        'w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
        className
      )}
    >
      <option value="" disabled>{placeholder}</option>
      {(options || []).map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
