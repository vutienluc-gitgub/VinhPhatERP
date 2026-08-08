import { Icon } from '@/shared/components';
import { EntityLink } from '@/shared/components';
import { MoneyText } from '@/shared/value';
import type { Shipment, ShipmentStatus } from '@/features/shipments/types';
import { calcShipmentCost } from '@/features/shipments/shipments.constants';
import { SHIPMENT_LIST_MESSAGES as MSG } from '@/features/shipments/shipments.constants';
import { SHIPMENT_STATUS_LABELS } from '@/schema/shipment.schema';

export function ShipmentSaaSBadge({ status }: { status: ShipmentStatus }) {
  const label = SHIPMENT_STATUS_LABELS[status];

  const styles: Record<string, string> = {
    shipped: 'bg-info-soft/10 text-info dark:text-info ring-blue-500/20',
    delivered:
      'bg-success-soft/10 text-success dark:text-success ring-emerald-500/20',
    partially_returned:
      'bg-purple-500/10 text-purple-700 dark:text-purple-400 ring-purple-500/20',
    returned: 'bg-danger-soft/10 text-danger dark:text-danger ring-red-500/20',
    preparing:
      'bg-warning-soft/10 text-warning-strong dark:text-warning ring-amber-500/20',
  };
  const dotColors: Record<string, string> = {
    shipped: 'bg-info-soft',
    delivered: 'bg-success-soft',
    partially_returned: 'bg-purple-500',
    returned: 'bg-danger-soft',
    preparing: 'bg-warning-soft',
  };

  const currentStyle =
    styles[status] ||
    'bg-surface-strong/10 text-muted-foreground dark:text-muted-foreground ring-slate-500/20';
  const currentDot = dotColors[status] || 'bg-surface-strong';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${currentStyle}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${currentDot}`} />
      {label}
    </span>
  );
}

type ShipmentMobileCardProps = {
  shipment: Shipment;
  onConfirm: (shipment: Shipment) => void;
  onDelete: (id: string) => void;
  onExportPdf: (shipment: Shipment, format: 'A4' | 'A5_DOT_MATRIX') => void;
  onDeliveryConfirm: (shipment: Shipment) => void;
  isConfirming: boolean;
  isDeleting: boolean;
  isExporting: boolean;
};

export function ShipmentMobileCard({
  shipment: s,
  onConfirm,
  onDelete,
  onExportPdf,
  onDeliveryConfirm,
  isConfirming,
  isDeleting,
  isExporting,
}: ShipmentMobileCardProps) {
  const totalCost = calcShipmentCost(s);

  return (
    <div className="mobile-card">
      <div className="mobile-card-header">
        <span className="mobile-card-title text-lg font-bold">
          {s.shipment_number}
        </span>
        <ShipmentSaaSBadge status={s.status} />
      </div>
      <div className="mobile-card-body">
        <div className="mobile-card-row">
          <span className="label">{MSG.LBL_ORDER}:</span>
          <span className="value">
            {s.orders?.order_number ?? (
              <span className="text-[10px] font-bold uppercase tracking-wider text-warning bg-amber-50 px-1.5 py-0.5 rounded-full">
                {MSG.LBL_MANUAL}
              </span>
            )}
          </span>
        </div>
        <div className="mobile-card-row">
          <span className="label">{MSG.LBL_CUSTOMER}:</span>
          <span className="value">
            {s.customers?.name ? (
              <EntityLink
                entityType="customer"
                entityId={s.customer_id}
                label={s.customers.name}
              />
            ) : (
              '—'
            )}
          </span>
        </div>
        {s.delivery_staff && (
          <div className="mobile-card-row">
            <span className="label">{MSG.COL_DRIVER}:</span>
            <span className="value">{s.delivery_staff.full_name}</span>
          </div>
        )}
        <div className="mobile-card-row border-t border-border mt-2 pt-2">
          <span className="label font-bold">{MSG.LBL_COST}:</span>
          <span className="value font-bold text-foreground">
            {totalCost ? (
              <>
                <MoneyText value={totalCost} />
              </>
            ) : (
              '—'
            )}
          </span>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-3 border-t border-border/10">
        {s.status === 'preparing' && (
          <div className="flex flex-row gap-2 w-full">
            <button
              className="btn-secondary flex-1 py-2.5 justify-center text-success text-xs font-bold"
              onClick={(e) => {
                e.stopPropagation();
                onConfirm(s);
              }}
              disabled={isConfirming}
            >
              <Icon name="CheckCircle" size={16} /> {MSG.BTN_CONFIRM}
            </button>
            <button
              className="btn-secondary flex-1 py-2.5 justify-center text-danger text-xs font-bold"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(s.id);
              }}
              disabled={isDeleting}
            >
              <Icon name="Trash2" size={16} /> {MSG.BTN_DELETE}
            </button>
          </div>
        )}
        {s.status !== 'preparing' && (
          <div className="flex flex-row gap-2 w-full">
            <button
              className="btn-secondary flex-1 py-2.5 justify-center text-xs font-bold"
              onClick={(e) => {
                e.stopPropagation();
                onExportPdf(s, 'A4');
              }}
              disabled={isExporting}
            >
              <Icon name="Printer" size={16} /> {MSG.BTN_PRINT_A4}
            </button>
            <button
              className="btn-secondary flex-1 py-2.5 justify-center text-xs font-bold"
              onClick={(e) => {
                e.stopPropagation();
                onExportPdf(s, 'A5_DOT_MATRIX');
              }}
              disabled={isExporting}
            >
              <Icon name="Printer" size={16} /> {MSG.BTN_PRINT_A5}
            </button>
          </div>
        )}
        {s.status === 'shipped' && (
          <button
            className="btn-primary w-full py-3 justify-center text-xs font-black shadow-lg shadow-primary/20"
            onClick={(e) => {
              e.stopPropagation();
              onDeliveryConfirm(s);
            }}
          >
            <Icon name="Check" size={18} /> {MSG.BTN_RECEIVE_UPPER}
          </button>
        )}
      </div>
    </div>
  );
}
