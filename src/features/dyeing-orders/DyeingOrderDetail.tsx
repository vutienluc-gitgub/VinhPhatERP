import dayjs from 'dayjs';

import { Icon, Badge, type BadgeVariant } from '@/shared/components';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import { formatCurrency } from '@/shared/utils/format';
import { DYEING_ORDER_STATUSES } from '@/schema/dyeing-order.schema';
import {
  useDyeingOrder,
  useSendDyeingOrder,
  useCompleteDyeingOrder,
  useDeleteDyeingOrder,
} from '@/application/production';

import type { DyeingOrder } from './types';

type DyeingOrderDetailProps = {
  orderId: string;
  onBack: () => void;
  onEdit: (order: DyeingOrder) => void;
};

function getStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'draft':
      return 'gray';
    case 'sent':
      return 'info';
    case 'in_progress':
      return 'warning';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'danger';
    default:
      return 'gray';
  }
}

export function DyeingOrderDetail({
  orderId,
  onBack,
  onEdit,
}: DyeingOrderDetailProps) {
  const { data: order, isLoading, error } = useDyeingOrder(orderId);
  const sendMutation = useSendDyeingOrder();
  const deleteMutation = useDeleteDyeingOrder();
  const completeMutation = useCompleteDyeingOrder();
  const confirm = useConfirm();

  if (isLoading)
    return (
      <div className="p-10 text-center text-muted">Dang tai chi tiet...</div>
    );
  if (error || !order)
    return (
      <div className="p-10 text-center text-danger">
        Khong tim thay lenh nhuom.
      </div>
    );

  const handleSend = async () => {
    const ok = await confirm.confirm({
      message: 'Xac nhan gui lenh nhuom nay di nha cung cap?',
    });
    if (ok) sendMutation.mutate(orderId);
  };

  const handleDelete = async () => {
    const ok = await confirm.confirm({
      message: 'Ban co chac chan muon xoa lenh nhuom nay?',
      variant: 'danger',
    });
    if (ok) {
      deleteMutation.mutate(orderId, { onSuccess: onBack });
    }
  };

  const handleComplete = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const ok = await confirm.confirm({
      message: 'Linh vai thanh pham va hoan tat lenh nhuom nay?',
    });
    if (ok) {
      completeMutation.mutate({
        id: orderId,
        actualReturnDate: today,
      });
    }
  };

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-premium p-5 border-b border-border flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-3 flex-1">
          <button className="btn-secondary" onClick={onBack}>
            <Icon name="ArrowLeft" size={16} /> Quay lai
          </button>
          <div className="flex-1">
            <h3 className="title-premium flex items-center gap-2">
              {order.dyeing_order_number}
            </h3>
            <p className="text-muted mt-0.5 font-medium">
              {order.suppliers?.name}
            </p>
          </div>
        </div>
        <Badge variant={getStatusVariant(order.status)}>
          {DYEING_ORDER_STATUSES[order.status]?.label}
        </Badge>
      </div>

      <div className="p-5">
        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 bg-surface/50 p-4 rounded-xl">
          <div>
            <label className="text-xs font-bold text-muted uppercase block mb-1">
              Ngay gui
            </label>
            <div className="font-semibold">
              {dayjs(order.order_date).format('DD/MM/YYYY')}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase block mb-1">
              DK tra hang
            </label>
            <div className="font-semibold">
              {order.expected_return_date
                ? dayjs(order.expected_return_date).format('DD/MM/YYYY')
                : '—'}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase block mb-1">
              Don gia nhuộm
            </label>
            <div className="font-semibold text-primary">
              {formatCurrency(order.unit_price_per_kg)}đ/kg
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase block mb-1">
              Ma Lenh SX
            </label>
            <div className="font-semibold">{order.work_order_id || '—'}</div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap gap-2 mb-8 border-t border-border pt-4">
          {order.status === 'draft' && (
            <>
              <button className="btn-secondary" onClick={() => onEdit(order)}>
                <Icon name="Pencil" size={16} /> Chinh sua
              </button>
              <button
                className="btn-primary"
                onClick={handleSend}
                disabled={sendMutation.isPending}
              >
                <Icon name="Send" size={16} />{' '}
                {sendMutation.isPending ? 'Dang gui...' : 'Gui nhuom'}
              </button>
              <button
                className="btn-secondary text-danger"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <Icon name="Trash2" size={16} /> Xoa
              </button>
            </>
          )}

          {(order.status === 'sent' || order.status === 'in_progress') && (
            <button
              className="btn-primary"
              onClick={handleComplete}
              disabled={completeMutation.isPending}
            >
              <Icon name="CheckCircle" size={16} />{' '}
              {completeMutation.isPending
                ? 'Dang xu ly...'
                : 'Nhan hang & Hoan tat'}
            </button>
          )}

          <button
            className="btn-secondary ml-auto"
            onClick={() =>
              window.open(`/print/dyeing-order/${orderId}`, '_blank')
            }
          >
            <Icon name="Printer" size={16} /> In Phieu
          </button>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="mb-8 p-3 bg-surface border border-border rounded-lg text-sm">
            <span className="font-bold text-muted uppercase text-[0.7rem] block mb-1">
              Ghi chu chung
            </span>
            {order.notes}
          </div>
        )}

        {/* Items Table */}
        <h4 className="flex items-center gap-2 mb-4 text-sm font-bold uppercase tracking-wider text-muted">
          <Icon name="List" size={16} /> Danh sach cay vai (
          {order.dyeing_order_items?.length || 0})
        </h4>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>Ma cay vai</th>
                <th>Loai vai</th>
                <th className="text-right">Trong luong (kg)</th>
                <th>Mau nhuom</th>
                <th className="hide-mobile">Ghi chu item</th>
              </tr>
            </thead>
            <tbody>
              {order.dyeing_order_items?.map((item, idx) => (
                <tr key={item.id}>
                  <td className="text-muted">{idx + 1}</td>
                  <td className="font-bold">
                    {item.raw_fabric_roll?.roll_number}
                  </td>
                  <td className="text-muted">
                    {item.raw_fabric_roll?.fabric_type}
                  </td>
                  <td className="text-right tabular-nums">
                    {item.weight_kg} kg
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span className="font-medium text-primary">
                        {item.color_name}
                      </span>
                      <span className="text-[0.7rem] text-muted">
                        {item.color_code}
                      </span>
                    </div>
                  </td>
                  <td className="text-muted hide-mobile">
                    {item.notes || '—'}
                  </td>
                </tr>
              ))}
              <tr className="bg-surface/50 font-bold">
                <td colSpan={3} className="text-right">
                  Tong cong
                </td>
                <td className="text-right tabular-nums">
                  {order.dyeing_order_items
                    ?.reduce((s, it) => s + it.weight_kg, 0)
                    .toFixed(1)}{' '}
                  kg
                </td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
