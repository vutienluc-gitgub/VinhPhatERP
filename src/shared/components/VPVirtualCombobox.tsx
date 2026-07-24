import { useState, useRef, useMemo, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Icon } from '@/shared/components/Icon';
import { cn } from '@/shared/utils/cn';

export type VPVirtualComboboxOption = {
  value: string;
  label: string;
  code?: string;
  phone?: string;
  icon?: string;
  desc?: string;
};

export type VPVirtualComboboxProps = {
  options: VPVirtualComboboxOption[];
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
};

export function VPVirtualCombobox({
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
}: VPVirtualComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Lọc dữ liệu thủ công
  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const lowerSearch = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(lowerSearch) ||
        opt.code?.toLowerCase().includes(lowerSearch) ||
        opt.phone?.toLowerCase().includes(lowerSearch),
    );
  }, [options, search]);

  const selectedOption = options.find((opt) => opt.value === value);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  });

  useEffect(() => {
    if (open && parentRef.current) {
      rowVirtualizer.scrollToIndex(0);
    }
  }, [open, rowVirtualizer]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
            {selectedOption ? (
              <span className="truncate">{selectedOption.label}</span>
            ) : (
              <span className="text-muted truncate">{placeholder}</span>
            )}
          </div>
          <Icon
            name="ChevronDown"
            className="ml-2 h-4 w-4 shrink-0 opacity-50"
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <div className="flex flex-col h-full max-h-[300px]">
          <div className="flex items-center border-b px-3">
            <Icon name="Search" className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div
            ref={parentRef}
            className="flex-1 overflow-y-auto p-1"
            style={{ maxHeight: '250px' }}
          >
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted">
                {emptyText}
              </div>
            ) : (
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const opt = filteredOptions[virtualRow.index];
                  if (!opt) return null;
                  const isSelected = opt.value === value;

                  return (
                    <div
                      key={virtualRow.key}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <button
                        type="button"
                        className={cn(
                          'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-surface-secondary',
                          isSelected && 'bg-surface-secondary',
                        )}
                        onClick={() => {
                          onChange(isSelected ? '' : opt.value);
                          setOpen(false);
                          setSearch('');
                        }}
                      >
                        <div className="flex w-full items-center justify-between">
                          <div className="flex flex-col text-left">
                            <span>{opt.label}</span>
                            {(opt.code || opt.phone || opt.desc) && (
                              <span className="text-xs text-muted mt-0.5">
                                {opt.code && `Mã: ${opt.code} `}
                                {opt.phone && `SĐT: ${opt.phone} `}
                                {opt.desc && opt.desc}
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <Icon
                              name="Check"
                              className="h-4 w-4 shrink-0 text-primary"
                            />
                          )}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
