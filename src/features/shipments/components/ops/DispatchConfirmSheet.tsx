import { useState } from 'react';
import toast from 'react-hot-toast';

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Button } from '@/shared/components';
import { Combobox } from '@/shared/components/Combobox';
import { useOrderList } from '@/shared/hooks/useFormOptions';
import type { TruckSlot } from '@/features/shipments/ops-engine/useFleetCommander';
import { sumBy } from '@/shared/utils/array.util';

interface DispatchConfirmSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeTrucks: TruckSlot[];
  onConfirm: (orderId: string, customerId: string) => Promise<void>;
  isCommitting: boolean;
}

export function DispatchConfirmSheet({
  isOpen,
  onClose,
  activeTrucks,
  onConfirm,
  isCommitting,
}: DispatchConfirmSheetProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  // Fetch in_progress orders
  const { data: ordersResult } = useOrderList({ status: 'in_progress' }, 1);
  const orders = ordersResult?.data || [];

  const handleConfirm = async () => {
    if (!selectedOrderId) {
      toast.error('Vui lòng chọn đơn hàng mục tiêu.');
      return;
    }

    const order = orders.find((o) => o.id === selectedOrderId);
    if (!order || !order.customer_id) {
      toast.error('Không tìm thấy thông tin khách hàng cho đơn này.');
      return;
    }

    await onConfirm(selectedOrderId, order.customer_id);
  };

  const orderOptions = orders.map((o) => ({
    value: o.id,
    label: `${o.order_number} - ${o.customers?.name || 'Khách lẻ'}`,
  }));

  const totalRolls = sumBy(activeTrucks, (t) => t.rolls.length);

  if (!isOpen) return null;

  return (
    <AdaptiveSheet
      open={isOpen}
      onClose={onClose}
      title="Xác nhận phát lệnh giao hàng"
    >
      <div className="flex flex-col gap-4 p-4">
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg text-sm">
          <p className="font-bold mb-1 text-amber-900">
            Xác nhận thông tin chuyến đi
          </p>
          <p>
            Bạn đang lên lịch phát lệnh cho <b>{activeTrucks.length}</b> xe chở
            tổng cộng <b>{totalRolls}</b> cuộn vải. Vui lòng chỉ định{' '}
            <b>Đơn hàng</b> mà các xe này đang thi hành.
          </p>
        </div>

        <div className="form-field mt-2">
          <label className="font-medium text-slate-700 block mb-2">
            Chọn đơn hàng xuất <span className="text-rose-500">*</span>
          </label>
          <Combobox
            options={orderOptions}
            value={selectedOrderId}
            onChange={setSelectedOrderId}
            placeholder="— Tìm theo mã đơn / tên khách —"
          />
        </div>

        <div
          className="modal-footer"
          style={{
            marginTop: '1.5rem',
            padding: 0,
            border: 'none',
            justifyContent: 'flex-end',
          }}
        >
          <Button variant="secondary" onClick={onClose} disabled={isCommitting}>
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={isCommitting || !selectedOrderId}
          >
            {isCommitting ? 'Đang phát lệnh...' : 'Chốt Lệnh Ngay'}
          </Button>
        </div>
      </div>
    </AdaptiveSheet>
  );
}
