import dayjs from 'dayjs';

import { Badge, Icon } from '@/shared/components';
import { MoneyText } from '@/shared/value';
import { DYEING_ORDER_STATUSES } from '@/schema/dyeing-order.schema';
import type { DyeingOrder } from '@/features/dyeing-orders/types';
import { getStatusVariant } from '@/features/dyeing-orders/dyeing-orders.constants';

type DyeingOrderMobileCardProps = {
  order: DyeingOrder;
};

export function DyeingOrderMobileCard({
  order: row,
}: DyeingOrderMobileCardProps) {
  return (
    <div className="mobile-card">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-bold text-foreground">
            {row.dyeing_order_number}
          </div>
          <div className="text-xs text-muted-foreground">
            {row.suppliers?.name}
          </div>
        </div>
        <Badge variant={getStatusVariant(row.status)}>
          {DYEING_ORDER_STATUSES[row.status]?.label ?? row.status}
        </Badge>
      </div>
      <div className="flex justify-between items-end mt-3 border-t border-border pt-2">
        <div className="text-[0.7rem] text-muted-foreground flex items-center gap-1">
          <Icon name="Calendar" size={16} />
          {row.order_date ? dayjs(row.order_date).format('DD/MM/YYYY') : '—'}
        </div>
        <div className="font-bold text-sm">
          <MoneyText value={row.unit_price_per_kg} />
          /kg
        </div>
      </div>
    </div>
  );
}
