import React, {
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from 'react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/shared/utils/cn';
import { Icon } from '@/shared/components';

export interface VPBaseComboboxRef {
  open: () => void;
  close: () => void;
  focus: () => void;
  clear: () => void;
}

export interface VPBaseComboboxProps<T> {
  options: T[];
  value?: string;
  onChange: (value: string) => void;

  getOptionValue: (option: T) => string;
  getOptionLabel: (option: T) => string;

  renderValue?: (option: T | undefined) => React.ReactNode;

  searchFn?: (option: T, keyword: string) => boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (search: string) => void;

  disabled?: boolean;
  loading?: boolean;
  hasError?: boolean;
  placeholder?: string;
  emptyText?: React.ReactNode;

  headerSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;

  className?: string;
  id?: string;

  renderList: (props: {
    filteredOptions: T[];
    focusedIndex: number;
    onSelect: (option: T) => void;
    setFocusedIndex: (index: number) => void;
  }) => React.ReactNode;
}

export const VPBaseCombobox = forwardRef(
  <T,>(
    {
      options,
      value,
      onChange,
      getOptionValue,
      getOptionLabel,
      renderValue,
      searchFn,
      searchPlaceholder = 'Tìm kiếm...',
      searchValue,
      onSearchChange,
      disabled,
      loading,
      hasError,
      placeholder = 'Chọn...',
      emptyText = 'Không có kết quả.',
      headerSlot,
      footerSlot,
      className,
      id,
      renderList,
    }: VPBaseComboboxProps<T>,
    ref: React.ForwardedRef<VPBaseComboboxRef>,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [internalSearch, setInternalSearch] = useState('');
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const search = searchValue !== undefined ? searchValue : internalSearch;

    const handleSearchChange = (val: string) => {
      if (searchValue === undefined) {
        setInternalSearch(val);
      }
      onSearchChange?.(val);
      setFocusedIndex(0); // Reset focus on search
    };

    // Reset search when popover closes (Bug 1)
    useEffect(() => {
      if (!isOpen) {
        if (searchValue === undefined) {
          setInternalSearch('');
        }
        onSearchChange?.('');
      }
    }, [isOpen, searchValue, onSearchChange]);

    const filteredOptions = useMemo(() => {
      if (!search) return options;
      const lowerSearch = search.toLowerCase();
      return options.filter((opt) => {
        if (searchFn) return searchFn(opt, lowerSearch);
        return getOptionLabel(opt).toLowerCase().includes(lowerSearch);
      });
    }, [options, search, searchFn, getOptionLabel]);

    // Sync selected option
    const selectedOption = useMemo(
      () => options.find((opt) => getOptionValue(opt) === value),
      [options, value, getOptionValue],
    );

    useImperativeHandle(ref, () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      focus: () => triggerRef.current?.focus(),
      clear: () => onChange(''),
    }));

    const handleSelect = (option: T) => {
      const val = getOptionValue(option);
      onChange(val === value ? '' : val); // toggle
      setIsOpen(false);
      handleSearchChange('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (filteredOptions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev,
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
            const opt = filteredOptions[focusedIndex];
            if (opt) handleSelect(opt);
          }
          break;
        case 'Home':
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setFocusedIndex(filteredOptions.length - 1);
          break;
      }
    };

    // Reset focus when opening
    useEffect(() => {
      if (isOpen) {
        const initialIndex = filteredOptions.findIndex(
          (opt) => getOptionValue(opt) === value,
        );
        setFocusedIndex(initialIndex >= 0 ? initialIndex : 0);
      } else {
        setFocusedIndex(-1);
      }
    }, [isOpen, value, filteredOptions, getOptionValue]);

    const activeDescendantId =
      focusedIndex >= 0 ? `vp-combo-opt-${focusedIndex}` : undefined;

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <PopoverTrigger asChild>
          <button
            id={id}
            ref={triggerRef}
            type="button"
            disabled={disabled || loading}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls="vp-combo-listbox"
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
                renderValue ? (
                  renderValue(selectedOption)
                ) : (
                  <span className="truncate">
                    {getOptionLabel(selectedOption!)}
                  </span>
                )
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
          onKeyDown={handleKeyDown}
        >
          <div className="flex flex-col h-full max-h-[400px]">
            {headerSlot && <div className="border-b">{headerSlot}</div>}

            <div className="flex items-center border-b px-3 shrink-0">
              <Icon
                name="Search"
                className="mr-2 h-4 w-4 shrink-0 opacity-50"
              />
              <input
                // eslint-disable-next-line no-restricted-syntax -- Allowed exception
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                aria-activedescendant={activeDescendantId}
                autoFocus // (Bug 3)
              />
            </div>

            <div
              id="vp-combo-listbox"
              role="listbox"
              className="flex-1 overflow-y-auto"
              style={{ maxHeight: '250px' }}
            >
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {loading ? ( // (Bug 6)
                    <span className="flex items-center justify-center gap-2">
                      <Icon
                        name="Loader2"
                        className="h-4 w-4 animate-spin opacity-50"
                      />
                      Đang tải...
                    </span>
                  ) : (
                    emptyText
                  )}
                </div>
              ) : (
                renderList({
                  filteredOptions,
                  focusedIndex,
                  onSelect: handleSelect,
                  setFocusedIndex,
                })
              )}
            </div>

            {footerSlot && <div className="border-t">{footerSlot}</div>}
          </div>
        </PopoverContent>
      </Popover>
    );
  },
);

VPBaseCombobox.displayName = 'VPBaseCombobox';

// Cast for generics
export type VPBaseComboboxComponent = <T>(
  props: VPBaseComboboxProps<T> & {
    ref?: React.ForwardedRef<VPBaseComboboxRef>;
  },
) => React.ReactElement;

export const VPBaseComboboxGeneric = VPBaseCombobox as VPBaseComboboxComponent;
