import { useState, useRef, useEffect, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';

import { Search, ChevronDown, Check } from '@/shared/icons';
import { Icon, type IconName } from '@/shared/components/Icon';

/** Tính toán vị trí dropdown dựa trên trigger element */
function getDropdownStyle(triggerEl: HTMLElement): React.CSSProperties {
  const rect = triggerEl.getBoundingClientRect();
  return {
    position: 'fixed',
    top: rect.bottom + 4,
    left: rect.left,
    width: rect.width,
    zIndex: 9999,
  };
}

export type ComboboxOption = {
  value: string;
  label: string;
  code?: string;
  phone?: string;
  icon?: string;
  desc?: string;
};

type ComboboxProps = {
  options: ComboboxOption[];
  value?: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  hasError?: boolean;
  /**
   * Cho phép nhập tự do — nếu text không khớp option nào, vẫn lưu text đó làm value.
   * Khi allowInput=true, Combobox hoạt động như input có gợi ý (autocomplete).
   */
  allowInput?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  id?: string;
  /** Choose visual style based on context */
  variant?: 'default' | 'table-cell';
};

export const Combobox = memo(function Combobox({
  options,
  value,
  onChange,
  onBlur,
  placeholder = 'Chọn...',
  disabled,
  className = '',
  hasError,
  allowInput = false,
  onKeyDown,
  id,
  variant = 'default',
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Tính toán vị trí dropdown khi mở (position: fixed không bị ảnh hưởng bởi overflow:hidden)
  useEffect(() => {
    if (isOpen && containerRef.current) {
      setDropdownStyle(getDropdownStyle(containerRef.current));
    }
  }, [isOpen]);

  // Đóng khi click ngoài (cần check cả dropdown portal vì nằm ngoài containerRef)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const insideContainer = containerRef.current?.contains(target) ?? false;
      const insideDropdown = dropdownRef.current?.contains(target) ?? false;
      if (!insideContainer && !insideDropdown) {
        if (allowInput && search) {
          onChange(search);
        }
        setIsOpen(false);
        onBlur?.();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [allowInput, search, onChange, onBlur]);

  // Sync search với value khi allowInput
  useEffect(() => {
    if (allowInput) {
      const selected = options.find((o) => o.value === value);
      setSearch(selected ? selected.label : (value ?? ''));
    }
  }, [value, options, allowInput]);

  const filteredOptions = useMemo(() => {
    // Normalizer: lowercase and remove common separators like -, ., space, /, _
    const normalize = (s: string) => s.toLowerCase().replace(/[-. /_]/g, '');
    const q = normalize(search);
    if (!q) return options;

    return options.filter(
      (opt) =>
        normalize(opt.label).includes(q) ||
        (opt.code && normalize(opt.code).includes(q)) ||
        (opt.phone && normalize(opt.phone).includes(q)) ||
        (opt.desc && normalize(opt.desc).includes(q)),
    );
  }, [options, search]);

  const selectedOption = options.find((o) => o.value === value);

  const boxClass =
    variant === 'table-cell' ? 'table-cell-input' : 'field-input';

  /* ── allowInput mode: render as <input> with dropdown suggestions ── */
  if (allowInput) {
    return (
      <div className={`relative ${className}`} ref={containerRef}>
        <div
          className={`${boxClass} flex items-center p-0${hasError ? ' is-error' : ''}${disabled ? ' opacity-50' : ''} ${className?.includes('h-') ? 'h-full min-h-0' : 'min-h-[44px]'}`}
        >
          <input
            id={id}
            ref={inputRef}
            type="text"
            disabled={disabled}
            value={search}
            placeholder={placeholder}
            className={`border-none outline-none bg-transparent flex-1 px-3 focus:ring-0 ${className?.includes('h-') ? 'h-full min-h-0' : 'min-h-[44px]'}`}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsOpen(true);
              // Nếu xóa hết → clear value
              if (!e.target.value) onChange('');
            }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => {
              // Commit giá trị khi blur nếu có text
              if (search.trim()) {
                const searchLower = search.trim().toLowerCase();
                const match = options.find(
                  (o) =>
                    o.label.toLowerCase() === searchLower ||
                    o.value.toLowerCase() === searchLower ||
                    (o.code && o.code.toLowerCase() === searchLower),
                );
                if (match) {
                  onChange(match.value);
                  setSearch(match.label);
                } else if (filteredOptions.length === 1) {
                  const first = filteredOptions[0]!;
                  onChange(first.value);
                  setSearch(first.label);
                } else {
                  onChange(search.trim());
                }
              } else {
                onChange('');
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredOptions.length > 0) {
                  const first = filteredOptions[0]!;
                  onChange(first.value);
                  setSearch(first.label);
                  setIsOpen(false);
                }
              }
              if (e.key === 'Escape') {
                e.stopPropagation();
                if (e.nativeEvent) {
                  e.nativeEvent.stopImmediatePropagation();
                }
                setIsOpen(false);
              }
              onKeyDown?.(e);
            }}
          />
          <ChevronDown
            className="w-4 h-4 text-[var(--text-secondary)] mr-3 shrink-0 cursor-pointer"
            onClick={() => {
              setIsOpen(!isOpen);
              inputRef.current?.focus();
            }}
          />
        </div>

        {isOpen &&
          filteredOptions.length > 0 &&
          createPortal(
            <div
              ref={dropdownRef}
              style={dropdownStyle}
              className="border border-[var(--border)] rounded-lg shadow-xl max-h-[240px] overflow-y-auto bg-surface"
            >
              {filteredOptions.map((opt) => {
                const isSelected = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent blur before click
                    }}
                    onClick={() => {
                      onChange(opt.value);
                      setSearch(opt.label);
                      setIsOpen(false);
                    }}
                    className={`combobox-option${isSelected ? ' is-selected' : ''}`}
                  >
                    <div className="flex flex-row items-center gap-2">
                      {opt.icon && (
                        <Icon
                          name={opt.icon as IconName}
                          size={16}
                          className="text-muted"
                        />
                      )}
                      <div className="flex flex-col">
                        <span>{opt.label}</span>
                        {(opt.code || opt.desc) && (
                          <span className="text-xs text-muted mt-0.5">
                            {opt.code && `Ma: ${opt.code} `}
                            {opt.desc && opt.desc}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check
                        className="w-4 h-4 shrink-0"
                        color="var(--primary)"
                      />
                    )}
                  </button>
                );
              })}
            </div>,
            document.body,
          )}
      </div>
    );
  }

  /* ── Default mode: dropdown picker only ── */
  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => {
          if (!isOpen) onBlur?.();
        }}
        className={`${boxClass} flex items-center justify-between w-full text-left bg-surface px-3 ${className?.includes('h-') ? 'h-full min-h-0' : 'min-h-[44px]'} ${hasError ? 'is-error' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onKeyDown={(e) => {
          onKeyDown?.(e);
        }}
      >
        <span className="flex items-center gap-2 truncate pr-2">
          {selectedOption ? (
            <>
              {selectedOption.icon && (
                <Icon
                  name={selectedOption.icon as IconName}
                  size={16}
                  className="text-primary flex-shrink-0"
                />
              )}
              <span className="text-[var(--text-primary)]">
                {selectedOption.label}
              </span>
            </>
          ) : (
            <span className="text-muted">{placeholder}</span>
          )}
        </span>
        <ChevronDown className="w-4 h-4 text-[var(--text-secondary)] shrink-0 ml-2" />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="border border-[var(--border)] rounded-lg shadow-xl max-h-[240px] overflow-y-auto bg-surface"
          >
            <div className="sticky top-0 p-2 border-b border-[var(--border-light)] flex flex-row items-center gap-2 z-10 bg-surface">
              <Search className="w-4 h-4 text-[var(--text-secondary)]" />
              <input
                type="text"
                className="w-full text-sm outline-none bg-transparent text-[var(--text-primary)] border-none min-h-[32px]"
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
              />
            </div>
            <div className="p-1">
              {filteredOptions.length === 0 ? (
                <div className="p-2 text-sm text-center text-[var(--text-secondary)]">
                  Không tìm thấy kết quả
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = value === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent blur before click
                      }}
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                        setSearch('');
                        onBlur?.();
                      }}
                      className={`combobox-option${isSelected ? ' is-selected' : ''}`}
                    >
                      <div className="flex flex-row items-center gap-2">
                        {opt.icon && (
                          <Icon
                            name={opt.icon as IconName}
                            size={16}
                            className="text-muted"
                          />
                        )}
                        <div className="flex flex-col">
                          <span>{opt.label}</span>
                          {(opt.code || opt.phone || opt.desc) && (
                            <span className="text-xs text-muted mt-0.5">
                              {opt.code && `Ma: ${opt.code} `}
                              {opt.phone && `SDT: ${opt.phone} `}
                              {opt.desc && opt.desc}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <Check
                          className="w-4 h-4 shrink-0"
                          color="var(--primary)"
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
});
