import { useState, KeyboardEvent, useRef } from 'react';

import { Icon } from './Icon';

type TagInputProps = {
  value?: string[];
  onChange?: (tags: string[]) => void;
  placeholder?: string;
  hasError?: boolean;
  className?: string;
  id?: string;
};

export function TagInput({
  value = [],
  onChange,
  placeholder = 'Nhập và nhấn Enter...',
  hasError,
  className = '',
  id,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange?.([...value, trimmed]);
    }
    setInputValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove last tag if backspace is pressed and input is empty
      onChange?.(value.slice(0, -1));
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    onChange?.(value.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div
      className={`field-input flex flex-wrap gap-2 items-center !h-auto min-h-[40px] py-1.5 ${
        hasError ? 'is-error' : ''
      } ${className}`}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag, index) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-strong border border-border rounded-full text-sm font-medium text-text transition-colors hover:bg-red-50 hover:border-red-200 hover:text-red-600 group cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveTag(index);
          }}
        >
          {tag}
          <Icon
            name="X"
            size={12}
            className="text-muted group-hover:text-red-500"
          />
        </span>
      ))}

      <input
        ref={inputRef}
        id={id}
        type="text"
        className="flex-1 min-w-[120px] bg-transparent border-none outline-none p-0 text-sm"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (inputValue.trim()) {
            handleAddTag(inputValue);
          }
        }}
        placeholder={value.length === 0 ? placeholder : ''}
      />
    </div>
  );
}
