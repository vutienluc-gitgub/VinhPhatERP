import {
  forwardRef,
  type ForwardedRef,
  type KeyboardEvent,
  type ReactElement,
} from 'react';

import { cn } from '@/shared/utils/cn';

import { Icon, type IconName } from './Icon';

export interface SegmentedControlOption<T extends string = string> {
  value: T;
  label?: string;
  icon?: IconName;
  title?: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedControlOption<T>[];
  size?: 'sm' | 'md';
  variant?: 'surface' | 'primary';
  ariaLabel?: string;
  className?: string;
  fullWidth?: boolean;
}

function SegmentedControlInner<T extends string = string>(
  {
    value,
    onChange,
    options,
    size = 'sm',
    variant = 'surface',
    ariaLabel = 'Chế độ xem',
    className,
    fullWidth = false,
  }: SegmentedControlProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const enabledOptions = options.filter((o) => !o.disabled);
    const currentIndex = enabledOptions.findIndex((o) => o.value === value);
    if (currentIndex === -1) return;

    if (enabledOptions.length === 0) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % enabledOptions.length;
      const target = enabledOptions[nextIndex];
      if (target) onChange(target.value);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex =
        (currentIndex - 1 + enabledOptions.length) % enabledOptions.length;
      const target = enabledOptions[prevIndex];
      if (target) onChange(target.value);
    } else if (e.key === 'Home') {
      e.preventDefault();
      const first = enabledOptions[0];
      if (first) onChange(first.value);
    } else if (e.key === 'End') {
      e.preventDefault();
      const last = enabledOptions[enabledOptions.length - 1];
      if (last) onChange(last.value);
    }
  };

  const isSmall = size === 'sm';

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cn(
        'inline-flex items-center p-0.5 rounded-lg bg-surface-secondary border border-border select-none outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
        isSmall ? 'h-[34px]' : 'h-[38px]',
        fullWidth && 'w-full flex',
        className,
      )}
    >
      {options.map((option) => {
        const isSelected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={option.disabled}
            title={option.title || option.label}
            onClick={() => !option.disabled && onChange(option.value)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 font-medium transition-all duration-150 cursor-pointer rounded-md outline-none',
              isSmall
                ? 'px-2.5 py-1 text-xs min-w-[30px] h-[28px]'
                : 'px-3 py-1.5 text-sm min-w-[34px] h-[32px]',
              fullWidth && 'flex-1',
              isSelected
                ? variant === 'primary'
                  ? 'bg-primary text-inverse-foreground font-semibold shadow-xs'
                  : 'bg-surface-strong text-foreground font-semibold shadow-xs border border-border/50'
                : 'text-muted hover:text-foreground hover:bg-surface-hover active:bg-surface-subtle',
              option.disabled &&
                'opacity-50 pointer-events-none cursor-not-allowed',
            )}
          >
            {option.icon && (
              <Icon
                name={option.icon}
                size={isSmall ? 15 : 17}
                strokeWidth={isSelected ? 2 : 1.75}
                className="shrink-0"
              />
            )}
            {option.label && <span className="truncate">{option.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

export const SegmentedControl = forwardRef(SegmentedControlInner) as <
  T extends string = string,
>(
  props: SegmentedControlProps<T> & { ref?: ForwardedRef<HTMLDivElement> },
) => ReactElement | null;
