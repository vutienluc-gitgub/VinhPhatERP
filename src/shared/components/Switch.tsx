import { useId } from 'react';

interface SwitchProps {
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
}

/**
 * Switch component chuẩn Accessible.
 * Pattern: `<input type="checkbox" role="switch">` nested inside `<label>`.
 * Không dùng `htmlFor` vì input đã nằm bên trong label (implicit association).
 */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id: externalId,
}: SwitchProps) {
  const autoId = useId();
  const inputId = externalId || autoId;
  const descId = description ? `${inputId}-desc` : undefined;

  return (
    <label
      className={`inline-flex items-start gap-3 select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
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

      <span className="relative inline-flex shrink-0 pt-0.5">
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
          style={!checked ? { backgroundColor: 'var(--border)' } : undefined}
          className={`pointer-events-none block h-7 w-12 rounded-full transition-colors duration-200 ${
            checked ? 'bg-primary' : ''
          } peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50 peer-focus-visible:ring-offset-2`}
        />
        {/* Thumb */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute top-1 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </span>
    </label>
  );
}
