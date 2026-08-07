import { forwardRef } from 'react';

import { Icon } from '@/shared/components';

import { VPVirtualCombobox } from './VPVirtualCombobox';
import { VPAsyncCombobox } from './VPAsyncCombobox';
import { VPBaseComboboxRef } from './VPBaseCombobox';

export interface EntityOption {
  id: string;
  name: string;
  code?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface VPEntityPickerProps {
  options?: EntityOption[];
  fetcher?: (keyword: string) => Promise<EntityOption[]>;
  value?: string;
  onChange: (value: string) => void;
  variant?: 'standard' | 'avatar' | 'compact';
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
}

export const VPEntityPicker = forwardRef<
  VPBaseComboboxRef,
  VPEntityPickerProps
>(
  (
    {
      options,
      fetcher,
      value,
      onChange,
      variant = 'standard',
      placeholder = 'Chọn...',
      disabled,
      hasError,
      className,
    },
    ref,
  ) => {
    const getOptionValue = (opt: EntityOption) => opt.id;
    const getOptionLabel = (opt: EntityOption) => opt.name;

    const renderOption = (opt: EntityOption, isSelected: boolean) => {
      if (variant === 'avatar') {
        return (
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-secondary">
                {opt.avatarUrl ? (
                  <img
                    src={opt.avatarUrl}
                    alt={opt.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <Icon name="User" className="h-4 w-4 text-muted" />
                )}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-medium">{opt.name}</span>
                {(opt.code || opt.phone) && (
                  <span className="text-xs text-muted">
                    {opt.code && `${opt.code} `}
                    {opt.phone && `- ${opt.phone}`}
                  </span>
                )}
              </div>
            </div>
            {isSelected && (
              <Icon name="Check" className="h-4 w-4 text-primary" />
            )}
          </div>
        );
      }

      if (variant === 'compact') {
        return (
          <div className="flex w-full items-center justify-between">
            <span className="truncate text-sm">{opt.name}</span>
            {isSelected && (
              <Icon name="Check" className="h-4 w-4 shrink-0 text-primary" />
            )}
          </div>
        );
      }

      // Standard variant
      return (
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-col text-left">
            <span className="text-sm font-medium">{opt.name}</span>
            {(opt.code || opt.phone) && (
              <span className="text-xs text-muted">
                {opt.code && `Mã: ${opt.code} `}
                {opt.phone && `SĐT: ${opt.phone}`}
              </span>
            )}
          </div>
          {isSelected && (
            <Icon name="Check" className="h-4 w-4 shrink-0 text-primary" />
          )}
        </div>
      );
    };

    const searchFn = (opt: EntityOption, keyword: string) => {
      const k = keyword.toLowerCase();
      return (
        opt.name.toLowerCase().includes(k) ||
        (opt.code?.toLowerCase().includes(k) ?? false) ||
        (opt.phone?.toLowerCase().includes(k) ?? false)
      );
    };

    if (fetcher) {
      return (
        <VPAsyncCombobox<EntityOption>
          ref={ref}
          fetcher={fetcher}
          value={value}
          onChange={onChange}
          getOptionValue={getOptionValue}
          getOptionLabel={getOptionLabel}
          renderOption={renderOption}
          placeholder={placeholder}
          disabled={disabled}
          hasError={hasError}
          className={className}
        />
      );
    }

    if (options) {
      return (
        <VPVirtualCombobox<EntityOption>
          ref={ref}
          options={options}
          value={value}
          onChange={onChange}
          getOptionValue={getOptionValue}
          getOptionLabel={getOptionLabel}
          renderOption={renderOption}
          searchFn={searchFn}
          placeholder={placeholder}
          disabled={disabled}
          hasError={hasError}
          className={className}
        />
      );
    }

    return null;
  },
);

VPEntityPicker.displayName = 'VPEntityPicker';
