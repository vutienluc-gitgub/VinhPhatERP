import { useState, useRef, useEffect, useMemo } from 'react';

import { Search, ChevronDown, Check } from '@/shared/icons';

export type ComboboxOption = {
  value: string;
  label: string;
  code?: string;
  phone?: string;
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
};

export function Combobox({
  options,
  value,
  onChange,
  onBlur,
  placeholder = 'Chọn...',
  disabled,
  className = '',
  hasError,
  allowInput = false,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Đóng khi click ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        if (allowInput && search) {
          // Khi allowInput: lưu text đang nhập nếu rời khỏi
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
        (opt.phone && normalize(opt.phone).includes(q)),
    );
  }, [options, search]);

  const selectedOption = options.find((o) => o.value === value);

  /* ── allowInput mode: render as <input> with dropdown suggestions ── */
  if (allowInput) {
    return (
      <div className={`relative ${className}`} ref={containerRef}>
        <div
          className={`field-input flex items-center${hasError ? ' is-error' : ''}${disabled ? ' opacity-50' : ''}`}
          style={{
            padding: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            disabled={disabled}
            value={search}
            placeholder={placeholder}
            className="field-input"
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              flex: 1,
              minHeight: '44px',
              padding: '0 0.75rem',
            }}
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
                const match = options.find(
                  (o) => o.label.toLowerCase() === search.trim().toLowerCase(),
                );
                onChange(match ? match.value : search.trim());
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
                setIsOpen(false);
              }
            }}
          />
          <ChevronDown
            style={{
              width: '1rem',
              height: '1rem',
              color: 'var(--text-secondary)',
              marginRight: '0.75rem',
              flexShrink: 0,
              cursor: 'pointer',
            }}
            onClick={() => {
              setIsOpen(!isOpen);
              inputRef.current?.focus();
            }}
          />
        </div>

        {isOpen && filteredOptions.length > 0 && (
          <div
            className="absolute z-50 w-full mt-1 border border-[var(--border)] rounded-lg shadow-lg max-h-[240px] overflow-y-auto"
            style={{ backgroundColor: 'var(--surface)' }}
          >
            {filteredOptions.map((opt) => {
              const isSelected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent blur before click
                    onChange(opt.value);
                    setSearch(opt.label);
                    setIsOpen(false);
                  }}
                  className={`combobox-option${isSelected ? ' is-selected' : ''}`}
                >
                  <div className="flex flex-col">
                    <span>{opt.label}</span>
                    {opt.code && (
                      <span className="text-xs text-muted mt-0.5">
                        Ma: {opt.code}
                      </span>
                    )}
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
          </div>
        )}
      </div>
    );
  }

  /* ── Default mode: dropdown picker only ── */
  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => {
          if (!isOpen) onBlur?.();
        }}
        className={`field-select flex items-center justify-between w-full text-left bg-surface relative ${
          hasError ? 'is-error' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{
          paddingRight: '2.5rem',
          minHeight: '44px',
        }}
      >
        <span className="truncate">
          {selectedOption ? (
            <span style={{ color: 'var(--text-primary)' }}>
              {selectedOption.label}
            </span>
          ) : (
            <span style={{ color: 'var(--text-secondary)' }}>
              {placeholder}
            </span>
          )}
        </span>
        <ChevronDown
          style={{
            width: '1rem',
            height: '1rem',
            color: 'var(--text-secondary)',
            position: 'absolute',
            right: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 border border-[var(--border)] rounded-lg shadow-lg max-h-[240px] overflow-y-auto"
          style={{ backgroundColor: 'var(--surface)' }}
        >
          <div
            className="sticky top-0 p-2 border-b border-[var(--border-light)] flex flex-row items-center gap-2 z-10"
            style={{ backgroundColor: 'var(--surface)' }}
          >
            <Search className="w-4 h-4 text-[var(--text-secondary)]" />
            <input
              type="text"
              className="w-full text-sm outline-none bg-transparent text-[var(--text-primary)] border-none min-h-[32px]"
              placeholder="Tim kiem..."
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
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch('');
                      onBlur?.();
                    }}
                    className={`combobox-option${isSelected ? ' is-selected' : ''}`}
                  >
                    <div className="flex flex-col">
                      <span>{opt.label}</span>
                      {(opt.code || opt.phone) && (
                        <span className="text-xs text-muted mt-0.5">
                          {opt.code && `Ma: ${opt.code} `}
                          {opt.phone && `SDT: ${opt.phone}`}
                        </span>
                      )}
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
        </div>
      )}
    </div>
  );
}
