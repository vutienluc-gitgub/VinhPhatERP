import { useState } from 'react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Icon } from '@/shared/components/Icon';
import { cn } from '@/shared/utils/cn';
import { formatPhoneNumber } from '@/shared/utils/phone';

export type VPComboboxOption = {
  value: string;
  label: string;
  code?: string;
  phone?: string;
  icon?: string;
  desc?: string;
};

export type VPComboboxProps = {
  options: VPComboboxOption[];
  value?: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  hasError?: boolean;
  loading?: boolean;
  id?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  allowCreatable?: boolean;
};

export function VPCombobox({
  options,
  value,
  onChange,
  onBlur,
  placeholder = 'Chọn...',
  disabled = false,
  className = '',
  hasError = false,
  loading = false,
  id,
  searchPlaceholder = 'Tìm kiếm...',
  emptyText = 'Không có kết quả.',
  allowCreatable = false,
}: VPComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // If it's a created value not in options, we should still show it.
  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : value;

  const exactMatch = options.some(
    (opt) => opt.label.toLowerCase() === searchValue.toLowerCase(),
  );
  const showCreatable =
    allowCreatable && searchValue.trim() !== '' && !exactMatch;

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled || loading}
          onBlur={onBlur}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
            hasError ? 'border-danger' : 'border-border',
            className,
          )}
        >
          <div className="flex flex-1 items-center gap-2 truncate text-left">
            {loading && (
              <Icon
                name="Loader2"
                className="h-4 w-4 animate-spin opacity-50"
              />
            )}
            {value ? (
              <span className="truncate">{displayLabel}</span>
            ) : (
              <span className="text-muted-foreground truncate">
                {placeholder}
              </span>
            )}
          </div>
          <Icon
            name="ChevronDown"
            className="ml-2 h-4 w-4 shrink-0 opacity-50"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? '' : currentValue);
                    setOpen(false);
                  }}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex flex-col text-left">
                      <span>{opt.label}</span>
                      {(opt.code || opt.phone || opt.desc) && (
                        <span className="text-xs text-muted-foreground mt-0.5">
                          {opt.code && `Mã: ${opt.code} `}
                          {opt.phone && `SĐT: ${formatPhoneNumber(opt.phone)} `}
                          {opt.desc && opt.desc}
                        </span>
                      )}
                    </div>
                    {value === opt.value && (
                      <Icon
                        name="Check"
                        className="h-4 w-4 shrink-0 text-foreground"
                      />
                    )}
                  </div>
                </CommandItem>
              ))}
              {showCreatable && (
                <CommandItem
                  value={searchValue}
                  onSelect={(currentValue) => {
                    onChange(currentValue);
                    setOpen(false);
                    setSearchValue('');
                  }}
                >
                  <div className="flex w-full items-center justify-between">
                    <span>
                      Tạo mới:{' '}
                      <span className="font-semibold">{searchValue}</span>
                    </span>
                    <Icon
                      name="Plus"
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                    />
                  </div>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
