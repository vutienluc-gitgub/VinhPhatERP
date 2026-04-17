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
    <div className="relative flex items-center w-full" style={style}>
      <Icon
        name="search"
        size={16}
        className="absolute left-3 text-[var(--fg-muted)] pointer-events-none"
      />
      <input
        ref={inputRef}
        type="text"
        className={`field-input pl-9 pr-12 w-full ${className}`}
        {...props}
      />
      <div className="absolute right-1.5 text-[0.65rem] text-[var(--fg-muted)] bg-[var(--surface-strong)] px-1.5 py-0.5 rounded border border-[var(--border)] pointer-events-none font-semibold font-mono">
        ⌘K
      </div>
    </div>
  );
}
