import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, ChevronDown, Check } from '@/shared/icons'

export type ComboboxOption = {
  value: string
  label: string
  code?: string
  phone?: string
}

type ComboboxProps = {
  options: ComboboxOption[]
  value?: string
  onChange: (val: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  hasError?: boolean
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Chọn...',
  disabled,
  className = '',
  hasError,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Đóng khi click ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Tìm kiếm theo nhiều trường
  const filteredOptions = useMemo(() => {
    if (!search) return options
    const s = search.toLowerCase()
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(s) ||
        (opt.code && opt.code.toLowerCase().includes(s)) ||
        (opt.phone && opt.phone.toLowerCase().includes(s))
    )
  }, [options, search])

  const selectedOption = options.find((o) => o.value === value)

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`field-select flex items-center justify-between w-full text-left bg-surface relative ${
          hasError ? 'is-error' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{ paddingRight: '2.5rem', minHeight: '44px' }}
      >
        <span className="truncate">
          {selectedOption ? (
            <span style={{ color: 'var(--text-primary)' }}>{selectedOption.label}</span>
          ) : (
            <span style={{ color: 'var(--text-secondary)' }}>{placeholder}</span>
          )}
        </span>
        <ChevronDown 
          style={{ width: '1rem', height: '1rem', color: 'var(--text-secondary)', position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} 
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            zIndex: 50,
            width: '100%',
            marginTop: '4px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            maxHeight: '240px',
            overflowY: 'auto'
          }}
        >
          <div style={{ position: 'sticky', top: 0, backgroundColor: 'var(--surface)', padding: '0.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 2 }}>
            <Search style={{ width: '1rem', height: '1rem', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              style={{
                width: '100%',
                fontSize: '0.875rem',
                outline: 'none',
                background: 'transparent',
                color: 'var(--text-primary)',
                border: 'none',
                minHeight: '32px'
              }}
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div style={{ padding: '0.25rem' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                Không tìm thấy kết quả
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setIsOpen(false)
                    setSearch('')
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem',
                    fontSize: '0.875rem',
                    borderRadius: 'calc(var(--radius) - 2px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: value === opt.value ? 'var(--primary-light, rgba(0,123,255,0.1))' : 'transparent',
                    color: value === opt.value ? 'var(--primary)' : 'var(--text-primary)',
                    border: 'none',
                    cursor: 'pointer',
                    minHeight: '40px'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: value === opt.value ? 500 : 400 }}>{opt.label}</span>
                    {(opt.code || opt.phone) && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {opt.code && `Mã: ${opt.code} `}
                        {opt.phone && `SĐT: ${opt.phone}`}
                      </span>
                    )}
                  </div>
                  {value === opt.value && <Check style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
