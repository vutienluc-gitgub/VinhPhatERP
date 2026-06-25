import { DataTable, Badge, type DataTableColumn } from '@/shared/components';
import { useInventoryAdjustmentHistory } from '@/application/inventory';
import type { InventoryAdjustment as BaseInventoryAdjustment } from '@/domain/inventory/inventory.types';

// Extend the type since generated types are not updated yet
type InventoryAdjustment = BaseInventoryAdjustment & {
  before_qty: number;
  after_qty: number;
  adjustment_qty: number;
  status: string;
};

const ADJUSTMENT_COLUMNS: DataTableColumn<InventoryAdjustment>[] = [
  {
    header: 'Ngày',
    cell: (r) => new Date(r.adjustment_date).toLocaleDateString('vi-VN'),
  },
  {
    header: 'Loại hàng',
    cell: (r) => {
      if (r.item_type === 'raw_fabric')
        return <Badge variant="gray">Vải mộc</Badge>;
      if (r.item_type === 'finished_fabric')
        return <Badge variant="info">Thành phẩm</Badge>;
      if (r.item_type === 'yarn') return <Badge variant="warning">Sợi</Badge>;
      return <Badge>{r.item_type}</Badge>;
    },
  },
  {
    header: 'Lý do',
    cell: (r) => {
      const type = r.adjustment_type as string;
      const map: Record<string, string> = {
        PHYSICAL_COUNT: 'Kiểm kê',
        DAMAGE: 'Hàng hỏng',
        QUALITY_REJECTION: 'Lỗi chất lượng',
        SAMPLE_USAGE: 'Cắt mẫu',
        PRODUCTION_CONSUMPTION: 'Tiêu hao SX',
        SYSTEM_CORRECTION: 'Sửa lỗi HT',
      };
      return (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800">{map[type] || type}</span>
          <span className="text-xs text-muted truncate max-w-[200px]">
            {r.reason}
          </span>
        </div>
      );
    },
  },
  {
    header: 'Trước ĐC',
    cell: (r) => <span className="text-muted">{r.before_qty ?? 0}</span>,
    className: 'text-right hide-mobile',
  },
  {
    header: 'Mức ĐC',
    cell: (r) => {
      const isPos = r.adjustment_qty > 0;
      return (
        <span
          className={`font-bold ${isPos ? 'text-emerald-600' : 'text-red-600'}`}
        >
          {isPos ? '+' : ''}
          {r.adjustment_qty}
        </span>
      );
    },
    className: 'text-right',
  },
  {
    header: 'Sau ĐC',
    cell: (r) => <span className="font-bold">{r.after_qty ?? 0}</span>,
    className: 'text-right hide-mobile',
  },
  {
    header: 'Trạng thái',
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
          Lỗi: {error instanceof Error ? error.message : String(error)}
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
      emptyStateTitle="Chưa có lịch sử điều chỉnh"
      emptyStateDescription="Mọi giao dịch điều chỉnh số lượng tồn kho sẽ hiển thị tại đây."
      emptyStateIcon="History"
      renderMobileCard={(r) => (
        <div className="p-4 border border-border rounded shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-sm">{r.adjustment_type}</span>
            <span
              className={`font-bold ${r.adjustment_qty > 0 ? 'text-emerald-600' : 'text-red-600'}`}
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
