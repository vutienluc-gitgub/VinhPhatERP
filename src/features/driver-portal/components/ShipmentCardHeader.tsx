import { Icon } from '@/shared/components';
import { toTelHref, normalizePhone } from '@/shared/utils/phone';
import {
  JOURNEY_STATUS_LABELS,
  type JourneyStatus,
} from '@/domain/logistics/driver-portal.types';
import { DRIVER_PORTAL_MESSAGES } from '@/features/driver-portal/constants';

export interface ShipmentCardHeaderProps {
  shipmentNumber: string;
  customerName?: string | null;
  customerPhone?: string | null;
  journeyStatus?: JourneyStatus | null;
  expanded: boolean;
  onToggle: () => void;
}

export function ShipmentCardHeader({
  shipmentNumber,
  customerName,
  customerPhone,
  journeyStatus,
  expanded,
  onToggle,
}: ShipmentCardHeaderProps) {
  return (
    <div
      onClick={onToggle}
      className="flex items-center justify-between w-full p-4 bg-transparent cursor-pointer gap-3 hover:bg-[var(--surface-hover)] transition-colors"
    >
      <div className="flex items-start gap-3 w-full">
        <div className="w-10 h-10 rounded-xl bg-[var(--surface-selected)] flex items-center justify-center shrink-0">
          <Icon name="Truck" size={20} className="text-[var(--primary)]" />
        </div>
        <div className="text-left flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-bold text-base text-[var(--foreground)] truncate">
                {shipmentNumber}
              </p>
              <p className="text-sm text-[var(--muted-foreground)] mt-0.5 truncate">
                {customerName ?? DRIVER_PORTAL_MESSAGES.CARD.DEFAULT_CUSTOMER}
              </p>
            </div>
            {customerPhone && (
              <a
                href={toTelHref(normalizePhone(customerPhone))}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(var(--success-rgb),0.1)] text-[var(--success)] hover:bg-[rgba(var(--success-rgb),0.2)] transition-colors shrink-0 touch-manipulation"
                aria-label={`Gọi ${customerPhone}`}
              >
                <Icon name="Phone" size={18} />
              </a>
            )}
          </div>
          {journeyStatus && (
            <span className="inline-block mt-1 text-xs font-semibold text-[var(--primary)] bg-[var(--surface-selected)] px-2 py-0.5 rounded-full">
              {JOURNEY_STATUS_LABELS[journeyStatus]}
            </span>
          )}
        </div>
      </div>
      <Icon
        name={expanded ? 'ChevronUp' : 'ChevronDown'}
        size={18}
        className="text-[var(--muted-foreground)] shrink-0"
      />
    </div>
  );
}
