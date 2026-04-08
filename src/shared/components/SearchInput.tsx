import { useEffect, useRef } from 'react';

import { Icon } from './Icon';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function SearchInput({
  className = '',
  style,
  ...props
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bắt phím Ctrl + K hoặc Cmd (Mac) + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        ...style,
      }}
    >
      <Icon
        name="search"
        size={16}
        style={{
          position: 'absolute',
          left: '0.75rem',
          color: 'var(--fg-muted)',
          pointerEvents: 'none',
        }}
      />
      <input
        ref={inputRef}
        type="text"
        className={`field-input ${className}`}
        style={{
          paddingLeft: '2.25rem',
          paddingRight: '3rem',
          width: '100%',
        }}
        {...props}
      />
      <div
        style={{
          position: 'absolute',
          right: '0.4rem',
          fontSize: '0.65rem',
          color: 'var(--fg-muted)',
          background: 'var(--surface-strong)',
          padding: '0.15rem 0.35rem',
          borderRadius: '4px',
          border: '1px solid var(--border)',
          pointerEvents: 'none',
          fontWeight: 600,
          fontFamily: 'monospace',
        }}
      >
        ⌘K
      </div>
    </div>
  );
}
