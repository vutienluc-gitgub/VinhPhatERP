import React, { useId, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/utils/cn';

/* ── Track variants (cva) ──────────────────────────────────────── */
const trackVariants = cva(
  'pointer-events-none block rounded-full transition-colors duration-200',
  {
    variants: {
      variant: {
        default: 'bg-border peer-checked:bg-primary',
        premium: 'switch-premium-track',
      },
      size: {
        sm: '',
        md: '',
        lg: '',
      },
    },
    compoundVariants: [
      { variant: 'default', size: 'sm', class: 'h-5 w-9' },
      { variant: 'default', size: 'md', class: 'h-7 w-12' },
      { variant: 'default', size: 'lg', class: 'h-8 w-14' },
      { variant: 'premium', size: 'sm', class: 'h-8 w-[60px]' },
      { variant: 'premium', size: 'md', class: 'h-10 w-[72px]' },
      { variant: 'premium', size: 'lg', class: 'h-11 w-[84px]' },
    ],
    defaultVariants: {
      variant: 'premium',
      size: 'md',
    },
  },
);

/* ── Thumb variants (cva) ──────────────────────────────────────── */
const thumbVariants = cva(
  'pointer-events-none absolute rounded-full transition-transform duration-200',
  {
    variants: {
      variant: {
        default: 'bg-white shadow',
        premium: 'switch-premium-thumb',
      },
      size: {
        sm: '',
        md: '',
        lg: '',
      },
    },
    compoundVariants: [
      // Default sizes
      {
        variant: 'default',
        size: 'sm',
        class: 'top-0.5 left-0.5 h-4 w-4 peer-checked:translate-x-4',
      },
      {
        variant: 'default',
        size: 'md',
        class: 'top-0.5 left-0.5 h-6 w-6 peer-checked:translate-x-5',
      },
      {
        variant: 'default',
        size: 'lg',
        class: 'top-1 left-1 h-6 w-6 peer-checked:translate-x-6',
      },
      // Premium sizes
      {
        variant: 'premium',
        size: 'sm',
        class: 'top-1 left-1 h-6 w-6 peer-checked:translate-x-7',
      },
      {
        variant: 'premium',
        size: 'md',
        class: 'top-1 left-1 h-8 w-8 peer-checked:translate-x-8',
      },
      {
        variant: 'premium',
        size: 'lg',
        class: 'top-1 left-1 h-9 w-9 peer-checked:translate-x-10',
      },
    ],
    defaultVariants: {
      variant: 'premium',
      size: 'md',
    },
  },
);

/* ── Types ─────────────────────────────────────────────────────── */
type SwitchVariantProps = VariantProps<typeof trackVariants>;

export interface SwitchProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange'>,
    SwitchVariantProps {
  /** Callback khi user toggle */
  onChange?: (checked: boolean) => void;
  /** Nhãn hiển thị bên trái */
  label?: string;
  /** Mô tả phụ bên dưới nhãn */
  description?: string;
  /** Hiệu ứng phát sáng khi bật (chỉ premium) */
  glow?: boolean;
  /** Text hiển thị khi bật (chỉ premium) */
  labelOn?: string;
  /** Text hiển thị khi tắt (chỉ premium) */
  labelOff?: string;
}

/**
 * Switch component chuẩn Accessible.
 * Pattern: `<input type="checkbox" role="switch">` nested inside `<label>`.
 * Hỗ trợ native ref và state uncontrolled thông qua `peer-checked`.
 *
 * Variants:
 *  - `default` — Switch cơ bản, kích thước nhỏ gọn.
 *  - `premium` — Switch cao cấp với gradient, glow, neumorphism thumb.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      onChange,
      label,
      description,
      disabled = false,
      id: externalId,
      variant = 'premium',
      size = 'md',
      glow = true,
      labelOn = 'ON',
      labelOff = 'OFF',
      className,
      ...props
    },
    ref,
  ) => {
    const autoId = useId();
    const inputId = externalId ?? autoId;
    const descId = description ? `${inputId}-desc` : undefined;
    const isPremium = variant === 'premium';

    return (
      <label
        className={cn(
          'inline-flex items-start gap-3 select-none',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          className,
        )}
      >
        {(label || description) && (
          <div className="flex-1 min-w-0">
            {label && (
              <span className="block text-base font-semibold text-text">
                {label}
              </span>
            )}
            {description && (
              <span id={descId} className="block text-sm text-muted mt-0.5">
                {description}
              </span>
            )}
          </div>
        )}

        <span
          className={cn(
            'relative inline-flex shrink-0',
            !isPremium && 'pt-0.5',
          )}
        >
          <input
            id={inputId}
            type="checkbox"
            role="switch"
            aria-describedby={descId}
            disabled={disabled}
            ref={ref}
            onChange={(e) => onChange?.(e.target.checked)}
            className="sr-only peer"
            {...props}
          />

          {/* Track */}
          <span
            aria-hidden="true"
            data-glow={isPremium && glow}
            className={cn(
              trackVariants({ variant, size }),
              'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50 peer-focus-visible:ring-offset-2',
            )}
          >
            {/* Premium label text inside track */}
            {isPremium && (labelOn || labelOff) && (
              <>
                <span
                  aria-hidden="true"
                  className="switch-premium-label switch-premium-label-on left-2.5 text-white"
                >
                  {labelOn}
                </span>
                <span
                  aria-hidden="true"
                  className="switch-premium-label switch-premium-label-off right-2.5 text-white/80"
                >
                  {labelOff}
                </span>
              </>
            )}
          </span>

          {/* Thumb */}
          <span
            aria-hidden="true"
            className={thumbVariants({ variant, size })}
          />
        </span>
      </label>
    );
  },
);

Switch.displayName = 'Switch';
