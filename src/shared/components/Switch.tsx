import { useId } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/utils/cn';

/* ── Track variants (cva) ──────────────────────────────────────── */
const trackVariants = cva(
  'pointer-events-none block rounded-full transition-colors duration-200',
  {
    variants: {
      variant: {
        default: 'h-7 w-12',
        premium: 'switch-premium-track h-10 w-[72px]',
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
      { variant: 'default', size: 'sm', class: 'top-0.5 left-0.5 h-4 w-4' },
      { variant: 'default', size: 'md', class: 'top-0.5 left-0.5 h-6 w-6' },
      { variant: 'default', size: 'lg', class: 'top-1 left-1 h-6 w-6' },
      // Premium sizes
      { variant: 'premium', size: 'sm', class: 'top-1 left-1 h-6 w-6' },
      { variant: 'premium', size: 'md', class: 'top-1 left-1 h-8 w-8' },
      { variant: 'premium', size: 'lg', class: 'top-1 left-1 h-9 w-9' },
    ],
    defaultVariants: {
      variant: 'premium',
      size: 'md',
    },
  },
);

/* ── Thumb translateX offsets (per variant + size) ──────────────── */
const THUMB_OFFSET: Record<string, string> = {
  'default-sm': 'translateX(16px)',
  'default-md': 'translateX(20px)',
  'default-lg': 'translateX(24px)',
  'premium-sm': 'translateX(28px)',
  'premium-md': 'translateX(32px)',
  'premium-lg': 'translateX(40px)',
};

/* ── Types ─────────────────────────────────────────────────────── */
type SwitchVariantProps = VariantProps<typeof trackVariants>;

interface SwitchProps extends SwitchVariantProps {
  /** Trạng thái bật/tắt */
  checked: boolean;
  /** Callback khi user toggle */
  onChange: (checked: boolean) => void;
  /** Nhãn hiển thị bên trái */
  label?: string;
  /** Mô tả phụ bên dưới nhãn */
  description?: string;
  /** Vô hiệu hóa */
  disabled?: boolean;
  /** ID cho testing/accessibility */
  id?: string;
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
 * Không dùng `htmlFor` vì input đã nằm bên trong label (implicit association).
 *
 * Variants:
 *  - `default` — Switch cơ bản, kích thước nhỏ gọn.
 *  - `premium` — Switch cao cấp với gradient, glow, neumorphism thumb.
 *
 * Sizes: `sm`, `md` (default), `lg`.
 */
export function Switch({
  checked,
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
}: SwitchProps) {
  const autoId = useId();
  const inputId = externalId ?? autoId;
  const descId = description ? `${inputId}-desc` : undefined;
  const isPremium = variant === 'premium';
  const offsetKey = `${variant}-${size}`;

  const thumbTransform = checked ? THUMB_OFFSET[offsetKey] : 'translateX(0)';

  return (
    <label
      className={cn(
        'inline-flex items-start gap-3 select-none',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
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
        className={cn('relative inline-flex shrink-0', !isPremium && 'pt-0.5')}
      >
        <input
          id={inputId}
          type="checkbox"
          role="switch"
          aria-checked={checked}
          aria-describedby={descId}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />

        {/* Track */}
        <span
          aria-hidden="true"
          data-checked={checked}
          data-glow={isPremium && glow}
          className={cn(
            trackVariants({ variant, size }),
            /* Default variant: flat color toggle */
            !isPremium && (checked ? 'bg-primary' : ''),
            /* Focus ring */
            'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50 peer-focus-visible:ring-offset-2',
          )}
          style={
            /* Default OFF state fallback background */
            !isPremium && !checked
              ? { backgroundColor: 'var(--border)' }
              : undefined
          }
        >
          {/* Premium label text inside track */}
          {isPremium && (labelOn || labelOff) && (
            <>
              <span
                aria-hidden="true"
                className={cn(
                  'switch-premium-label left-2.5',
                  checked ? 'text-white opacity-100' : 'text-white opacity-0',
                )}
              >
                {labelOn}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  'switch-premium-label right-2.5',
                  !checked
                    ? 'text-white/80 opacity-100'
                    : 'text-white opacity-0',
                )}
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
          style={
            {
              transform: thumbTransform,
              /* CSS var consumed by :active scale in switch.css */
              '--thumb-x': checked ? THUMB_OFFSET[offsetKey] : '0px',
            } as React.CSSProperties
          }
        />
      </span>
    </label>
  );
}
