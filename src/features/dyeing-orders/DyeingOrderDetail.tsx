import dayjs from 'dayjs';

import { Icon, Badge } from '@/shared/components';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import { MoneyText } from '@/shared/value';
import { DYEING_ORDER_STATUSES } from '@/schema/dyeing-order.schema';
import {
  useDyeingOrder,
  useSendDyeingOrder,
  useCompleteDyeingOrder,
  useDeleteDyeingOrder,
} from '@/application/production';
import { sumBy } from '@/shared/utils/array.util';

import type { DyeingOrder } from './types';
import {
  DYEING_ORDER_MESSAGES as MSG,
  getStatusVariant,
} from './dyeing-orders.constants';

type DyeingOrderDetailProps = {
  orderId: string;
  onBack: () => void;
  onEdit: (order: DyeingOrder) => void;
};

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
    return <div className="p-10 text-center text-muted">{MSG.ERR_LOAD}</div>;
  if (error || !order)
    return (
      <div className="p-10 text-center text-danger">{MSG.ERR_NOT_FOUND}</div>
    );

  const handleSend = async () => {
    const ok = await confirm.confirm({
      message: MSG.CONFIRM_SEND_MSG,
    });
    if (!ok) return;
    try {
      await sendMutation.mutateAsync(orderId);
    } catch (err) {
      await confirm.alert(
        `${MSG.ERR_SEND} ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  const handleDelete = async () => {
    const ok = await confirm.confirm({
      message: MSG.CONFIRM_DELETE_MSG,
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteMutation.mutateAsync(orderId);
      onBack();
    } catch (err) {
      await confirm.alert(
        `${MSG.ERR_DELETE} ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  const handleComplete = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const ok = await confirm.confirm({
      message: MSG.CONFIRM_COMPLETE_MSG,
    });
    if (!ok) return;
    try {
      await completeMutation.mutateAsync({
        id: orderId,
        actualReturnDate: today,
      });
    } catch (err) {
      await confirm.alert(
        `${MSG.ERR_COMPLETE} ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area border-b border-border flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-3 flex-1">
          <button className="btn-secondary" onClick={onBack}>
            <Icon name="ArrowLeft" size={16} /> {MSG.BTN_BACK}
          </button>
          <div className="flex-1">
            <span className="font-bold text-lg flex items-center gap-2">
              {order.dyeing_order_number}
            </span>
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
              {MSG.LBL_DATE}
            </label>
            <div className="font-semibold">
              {dayjs(order.order_date).format('DD/MM/YYYY')}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase block mb-1">
              {MSG.LBL_NOTE}
            </label>
            <div className="font-semibold">{order.notes || '—'}</div>
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase block mb-1">
              {MSG.COL_RETURN_DATE}
            </label>
            <div className="font-semibold">
              {order.expected_return_date
                ? dayjs(order.expected_return_date).format('DD/MM/YYYY')
                : '—'}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase block mb-1">
              {MSG.COL_PRICE}
            </label>
            <div className="font-semibold text-primary">
              <MoneyText value={order.unit_price_per_kg} />
              /kg
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase block mb-1">
              {MSG.LBL_WO_LINK}
            </label>
            <div className="font-semibold">{order.work_order_id || '—'}</div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap gap-2 mb-8 border-t border-border pt-4">
          {order.status === 'draft' && (
            <>
              <button className="btn-secondary" onClick={() => onEdit(order)}>
                <Icon name="Pencil" size={16} /> {MSG.BTN_EDIT}
              </button>
              <button
                className="btn-primary"
                onClick={handleSend}
                disabled={sendMutation.isPending}
              >
                <Icon name="Send" size={16} /> {MSG.BTN_SEND}
              </button>
              <button
                className="btn-secondary text-danger hover:bg-danger/5"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <Icon name="Trash2" size={16} /> {MSG.BTN_DELETE}
              </button>
            </>
          )}

          {(order.status === 'sent' || order.status === 'in_progress') && (
            <button
              className="btn-primary"
              onClick={handleComplete}
              disabled={completeMutation.isPending}
            >
              <Icon name="CheckCircle2" size={16} /> {MSG.BTN_COMPLETE}
            </button>
          )}

          <button
            className="btn-secondary ml-auto"
            onClick={() =>
              window.open(`/print/dyeing-order/${orderId}`, '_blank')
            }
          >
            <Icon name="Printer" size={16} /> {MSG.BTN_PRINT}
          </button>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="mb-8 p-3 bg-surface border border-border rounded-lg text-sm">
            <span className="font-bold text-muted uppercase text-[0.7rem] block mb-1">
              {MSG.LBL_NOTE}
            </span>
            {order.notes}
          </div>
        )}

        {/* Items Table */}
        <h4 className="flex items-center gap-2 mb-4 text-sm font-bold uppercase tracking-wider text-muted">
          <Icon name="List" size={16} /> {MSG.TITLE_ITEMS} (
          {order.dyeing_order_items?.length || 0})
        </h4>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>{MSG.COL_ITEM_ROLL}</th>
                <th>{MSG.COL_ITEM_TYPE}</th>
                <th className="text-right">{MSG.COL_ITEM_WEIGHT}</th>
                <th>{MSG.COL_ITEM_COLOR}</th>
                <th className="max-sm:hidden">{MSG.COL_ITEM_NOTE}</th>
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
                  <td className="text-muted max-sm:hidden">
                    {item.notes || '—'}
                  </td>
                </tr>
              ))}
              <tr className="bg-surface/50 font-bold">
                <td colSpan={3} className="text-right">
                  {MSG.LBL_TOTAL}
                </td>
                <td className="text-right tabular-nums">
                  {sumBy(
                    order.dyeing_order_items,
                    (it) => it.weight_kg,
                  ).toFixed(1)}{' '}
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
