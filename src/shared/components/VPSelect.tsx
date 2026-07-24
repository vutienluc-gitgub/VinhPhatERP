import React from 'react';

import { Icon } from '@/shared/components/Icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/shared/utils/cn';

export type VPOption<T extends string | number> = {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
};

export type VPSelectProps<T extends string | number> = {
  options: VPOption<T>[];
  value?: T;
  onValueChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  id?: string;
};

export function VPSelect<T extends string | number>({
  options,
  value,
  onValueChange,
  placeholder = 'Chọn...',
  disabled = false,
  loading = false,
  error = false,
  size = 'md',
  variant = 'default',
  className,
  id,
}: VPSelectProps<T>) {
  // Mapping size and variant to CSS classes
  const sizeClasses = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-10 px-3 py-2 text-sm',
    lg: 'h-12 px-4 py-3 text-base',
  };

  const variantClasses = {
    default: 'border-border bg-surface',
    outline: 'border-border bg-transparent',
    ghost: 'border-transparent bg-transparent hover:bg-surface-subtle',
  };

  const triggerClassName = cn(
    sizeClasses[size],
    variantClasses[variant],
    className,
  );

  // Convert T to string for Radix Select
  const stringValue =
    value !== undefined && value !== null ? String(value) : undefined;

  const handleValueChange = (val: string) => {
    // We need to map back to original type T
    const selectedOption = options.find((opt) => String(opt.value) === val);
    if (selectedOption) {
      onValueChange(selectedOption.value);
    }
  };

  return (
    <Select
      value={stringValue}
      onValueChange={handleValueChange}
      disabled={disabled || loading}
    >
      <SelectTrigger id={id} className={triggerClassName} error={error}>
        <div className="flex items-center gap-2 truncate">
          {loading && (
            <Icon name="Loader2" className="h-4 w-4 animate-spin opacity-50" />
          )}
          <SelectValue placeholder={placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem
            key={String(opt.value)}
            value={String(opt.value)}
            disabled={opt.disabled}
          >
            <div className="flex items-center gap-2">
              {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
              {opt.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
