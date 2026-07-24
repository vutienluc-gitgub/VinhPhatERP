import { Button, StatusBadge } from '@/shared/components';
import { formatQuantity } from '@/shared/utils/format';
import { MoneyText } from '@/shared/value';
import type { WorkOrderWithRelations } from '@/features/work-orders/types';
import { WORK_ORDER_MESSAGES as MSG } from '@/features/work-orders/work-orders.constants';

type WorkOrderMobileCardProps = {
  workOrder: WorkOrderWithRelations;
  onView: (id: string) => void;
  onEdit: (wo: WorkOrderWithRelations) => void;
  onStart: (id: string) => void;
  isStarting: boolean;
};

export function WorkOrderMobileCard({
  workOrder: wo,
  onView,
  onEdit,
  onStart,
  isStarting,
}: WorkOrderMobileCardProps) {
  return (
    <div className="mobile-card">
      <div className="mobile-card-header">
        <span className="mobile-card-title">{wo.work_order_number}</span>
        <StatusBadge domain="WORK_ORDER" status={wo.status} />
      </div>
      <div className="mobile-card-body space-y-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs text-muted">{MSG.COL_SUPPLIER}</span>
            <span className="font-bold break-words">{wo.supplier?.name}</span>
          </div>
          <div className="flex flex-col text-right shrink-0">
            <span className="text-xs text-muted">{MSG.COL_TARGET}</span>
            <span className="font-bold text-primary">
              {formatQuantity(wo.target_quantity)} m
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm mt-2">
          <div className="flex flex-col">
            <span className="text-xs text-muted">{MSG.COL_BOM}</span>
            <span className="font-medium">
              {wo.bom_template?.code} (V{wo.bom_version})
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-xs text-muted">{MSG.COL_PRICE}</span>
            <span className="font-medium">
              <MoneyText value={wo.weaving_unit_price} />
              /m
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-3 mt-1 border-t border-border/10">
          <Button
            variant="secondary"
            className="flex-1"
            leftIcon="Eye"
            onClick={(e) => {
              e.stopPropagation();
              onView(wo.id);
            }}
          >
            {MSG.BTN_VIEW}
          </Button>
          {wo.status === 'draft' && (
            <Button
              variant="secondary"
              className="flex-1 text-primary"
              leftIcon="Pencil"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(wo);
              }}
            >
              {MSG.BTN_EDIT}
            </Button>
          )}
          {wo.status === 'draft' && (
            <Button
              variant="primary"
              className="flex-1"
              leftIcon="Play"
              onClick={(e) => {
                e.stopPropagation();
                onStart(wo.id);
              }}
              disabled={isStarting}
            >
              {MSG.BTN_START_SHORT}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
