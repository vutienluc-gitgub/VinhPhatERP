import { Icon } from '@/shared/components';
import { MoneyText } from '@/shared/value';
import { DRIVER_PORTAL_MESSAGES } from '@/features/driver-portal/constants';

export interface ShipmentCardInfoProps {
  shipmentDate?: string | null;
  totalCost: number;
  deliveryAddress?: string | null;
  vehicleInfo?: string | null;
}

export function ShipmentCardInfo({
  shipmentDate,
  totalCost,
  deliveryAddress,
  vehicleInfo,
}: ShipmentCardInfoProps) {
  return (
    <div className="grid grid-cols-2 gap-2 p-3 bg-[var(--surface-secondary)] rounded-xl mb-4 text-sm">
      <div>
        <p className="text-[var(--muted-foreground)]">
          {DRIVER_PORTAL_MESSAGES.CARD.DELIVERY_DATE}
        </p>
        <p className="font-semibold text-[var(--foreground)]">
          {shipmentDate ?? '—'}
        </p>
      </div>
      <div>
        <p className="text-[var(--muted-foreground)]">
          {DRIVER_PORTAL_MESSAGES.CARD.SHIPPING_COST}
        </p>
        <p className="font-semibold text-[var(--foreground)]">
          {totalCost > 0 ? (
            <MoneyText value={totalCost} />
          ) : (
            DRIVER_PORTAL_MESSAGES.CARD.FREE_SHIPPING
          )}
        </p>
      </div>
      {deliveryAddress && (
        <div className="col-span-full mt-2">
          <p className="text-[var(--muted-foreground)]">
            {DRIVER_PORTAL_MESSAGES.CARD.DELIVERY_ADDRESS}
          </p>
          <div className="flex items-start justify-between gap-2 mt-0.5">
            <p className="font-medium text-[var(--foreground)] flex-1">
              {deliveryAddress}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(deliveryAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--surface-selected)] text-[var(--primary)] text-xs font-semibold hover:bg-[var(--surface-hover)] transition-colors shrink-0 touch-manipulation min-h-[36px]"
              onClick={(e) => e.stopPropagation()}
            >
              <Icon name="MapPin" size={14} />
              {DRIVER_PORTAL_MESSAGES.ACTIONS.OPEN_MAP}
            </a>
          </div>
        </div>
      )}
      {vehicleInfo && (
        <div className="col-span-full sm:col-span-1 mt-1">
          <p className="text-[var(--muted-foreground)]">
            {DRIVER_PORTAL_MESSAGES.CARD.VEHICLE}
          </p>
          <p className="font-medium text-[var(--foreground)]">{vehicleInfo}</p>
        </div>
      )}
    </div>
  );
}
