import { Icon } from '@/shared/components';
import type { JourneyStatus } from '@/domain/logistics/driver-portal.types';
import { DRIVER_PORTAL_MESSAGES } from '@/features/driver-portal/constants';

export function JourneyStepButton({
  status: _status,
  label,
  isActive,
  isDone,
  onClick,
  disabled,
}: {
  status: JourneyStatus;
  label: string;
  isActive: boolean;
  isDone: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isDone}
      className={`flex items-center gap-3 w-full py-3.5 px-4 rounded-xl text-left transition-colors ${
        isActive
          ? 'border-2 border-[var(--primary)] bg-[var(--surface-selected)]'
          : isDone
            ? 'border-2 border-[var(--success)] bg-[rgba(var(--success-rgb),0.06)] cursor-default'
            : 'border-2 border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]'
      } ${isDone || disabled ? 'cursor-default' : 'cursor-pointer'}`}
    >
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-inverse-foreground ${
          isDone
            ? 'bg-[var(--success)]'
            : isActive
              ? 'bg-[var(--primary)]'
              : 'bg-[var(--surface-subtle)]'
        }`}
      >
        {isDone ? (
          <Icon name="Check" size={14} />
        ) : isActive ? (
          <Icon name="ChevronRight" size={14} />
        ) : (
          <Icon
            name="Circle"
            size={14}
            className="text-[var(--muted-foreground)]"
          />
        )}
      </div>
      <span
        className={`text-sm ${isActive || isDone ? 'font-semibold' : 'font-normal'} ${
          isDone
            ? 'text-[var(--success)]'
            : isActive
              ? 'text-[var(--primary)]'
              : 'text-[var(--surface-subtle)]'
        }`}
      >
        {label}
      </span>
      {isActive && !isDone && (
        <span className="ml-auto text-xs font-semibold text-[var(--primary)] bg-[var(--surface-selected)] px-2 py-0.5 rounded-full">
          {DRIVER_PORTAL_MESSAGES.ACTIONS.CLICK_TO_UPDATE}
        </span>
      )}
    </button>
  );
}
