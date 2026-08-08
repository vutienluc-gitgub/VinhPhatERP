import { DataTable, Badge, type DataTableColumn } from '@/shared/components';
import { useInventoryAdjustmentHistory } from '@/application/inventory';
import type { InventoryAdjustment as BaseInventoryAdjustment } from '@/domain/inventory/inventory.types';
import { INVENTORY_MESSAGES as MSG } from '@/features/inventory/inventory.constants';

// Extend the type since generated types are not updated yet
type InventoryAdjustment = BaseInventoryAdjustment & {
  before_qty: number;
  after_qty: number;
  adjustment_qty: number;
  status: string;
};

const ADJUSTMENT_COLUMNS: DataTableColumn<InventoryAdjustment>[] = [
  {
    header: MSG.COL_ADJUST_DATE,
    cell: (r) => new Date(r.adjustment_date).toLocaleDateString('vi-VN'),
  },
  {
    header: MSG.COL_ADJUST_ITEM_TYPE,
    cell: (r) => {
      if (r.item_type === 'raw_fabric')
        return <Badge variant="gray">{MSG.VAL_RAW_FULL}</Badge>;
      if (r.item_type === 'finished_fabric')
        return <Badge variant="info">{MSG.VAL_FIN_FULL}</Badge>;
      if (r.item_type === 'yarn')
        return <Badge variant="warning">{MSG.OPT_YARN}</Badge>;
      return <Badge>{r.item_type}</Badge>;
    },
  },
  {
    header: MSG.COL_ADJUST_REASON,
    cell: (r) => {
      const type = r.adjustment_type as string;
      const map: Record<string, string> = {
        PHYSICAL_COUNT: MSG.REASON_PHYSICAL_COUNT,
        DAMAGE: MSG.REASON_DAMAGE,
        QUALITY_REJECTION: MSG.REASON_QUALITY_REJECTION,
        SAMPLE_USAGE: MSG.REASON_SAMPLE_USAGE,
        PRODUCTION_CONSUMPTION: MSG.REASON_PRODUCTION_CONSUMPTION,
        SYSTEM_CORRECTION: MSG.REASON_SYSTEM_CORRECTION,
      };
      return (
        <div className="flex flex-col">
          <span className="font-bold text-foreground">{map[type] || type}</span>
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
            {r.reason}
          </span>
        </div>
      );
    },
  },
  {
    header: MSG.COL_ADJUST_BEFORE,
    cell: (r) => (
      <span className="text-muted-foreground">{r.before_qty ?? 0}</span>
    ),
    className: 'text-right max-sm:hidden',
  },
  {
    header: MSG.COL_ADJUST_QTY,
    cell: (r) => {
      const isPos = r.adjustment_qty > 0;
      return (
        <span className={`font-bold ${isPos ? 'text-success' : 'text-danger'}`}>
          {isPos ? '+' : ''}
          {r.adjustment_qty}
        </span>
      );
    },
    className: 'text-right',
  },
  {
    header: MSG.COL_ADJUST_AFTER,
    cell: (r) => <span className="font-bold">{r.after_qty ?? 0}</span>,
    className: 'text-right max-sm:hidden',
  },
  {
    header: MSG.COL_ADJUST_STATUS,
    cell: (r) => (
      <Badge variant={r.status === 'APPROVED' ? 'success' : 'gray'}>
        {r.status || 'APPROVED'}
      </Badge>
    ),
  },
];

export function InventoryAdjustmentHistory() {
  const { data, isLoading, error } = useInventoryAdjustmentHistory();

  if (error) {
    return (
      <div className="p-4">
        <p className="error-inline">
          {MSG.ERR_ADJUST_HIST}{' '}
          {error instanceof Error ? error.message : String(error)}
        </p>
      </div>
    );
  }

  return (
    <DataTable
      data={(data as unknown as InventoryAdjustment[]) ?? []}
      columns={ADJUSTMENT_COLUMNS}
      isLoading={isLoading}
      rowKey={(r) => r.id}
      emptyStateTitle={MSG.EMPTY_ADJUST_HIST_TITLE}
      emptyStateDescription={MSG.EMPTY_ADJUST_HIST_DESC}
      emptyStateIcon="History"
      renderMobileCard={(r) => (
        <div className="p-4 border border-border rounded shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-sm">{r.adjustment_type}</span>
            <span
              className={`font-bold ${r.adjustment_qty > 0 ? 'text-success' : 'text-danger'}`}
            >
              {r.adjustment_qty > 0 ? '+' : ''}
              {r.adjustment_qty}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(r.adjustment_date).toLocaleDateString('vi-VN')}
          </p>
          <p className="text-sm mt-1">{r.reason}</p>
        </div>
      )}
    />
  );
}
