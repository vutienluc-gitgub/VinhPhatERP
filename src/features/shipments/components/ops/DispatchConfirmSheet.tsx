import { useState } from 'react';
import toast from 'react-hot-toast';

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Button } from '@/shared/components';
import { Combobox } from '@/shared/components/Combobox';
import { useOrderList } from '@/shared/hooks/useFormOptions';
import type { TruckSlot } from '@/features/shipments/ops-engine/useFleetCommander';
import { sumBy } from '@/shared/utils/array.util';
import { DISPATCH_CONFIRM_MESSAGES as MSG } from '@/features/shipments/shipments.constants';

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
      toast.error(MSG.ERR_NO_ORDER);
      return;
    }

    const order = orders.find((o) => o.id === selectedOrderId);
    if (!order || !order.customer_id) {
      toast.error(MSG.ERR_NO_CUSTOMER);
      return;
    }

    await onConfirm(selectedOrderId, order.customer_id);
  };

  const orderOptions = orders.map((o) => ({
    value: o.id,
    label: `${o.order_number} - ${o.customers?.name || MSG.LBL_RETAIL_CUST}`,
  }));

  const totalRolls = sumBy(activeTrucks, (t) => t.rolls.length);

  if (!isOpen) return null;

  return (
    <AdaptiveSheet open={isOpen} onClose={onClose} title={MSG.TITLE}>
      <div className="flex flex-col gap-4 p-4">
        <div className="bg-amber-50 border border-warning text-warning-strong p-4 rounded-lg text-sm">
          <h3 className="text-lg font-bold text-foreground mb-2">
            {MSG.HEADING}
          </h3>
          <p className="text-sm text-muted">
            {MSG.DESC_PART_1} <b>{activeTrucks.length}</b> {MSG.DESC_PART_2}{' '}
            <b>{totalRolls}</b> {MSG.DESC_PART_3} <b>{MSG.DESC_PART_4}</b>{' '}
            {MSG.DESC_PART_5}
          </p>
        </div>

        <div className="form-field mt-2">
          <label className="form-label block text-secondary">
            {MSG.LBL_ORDER} <span className="text-danger">*</span>
          </label>
          <Combobox
            options={orderOptions}
            value={selectedOrderId}
            onChange={setSelectedOrderId}
            placeholder={MSG.PLC_ORDER}
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
            {MSG.BTN_CANCEL}
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={isCommitting || !selectedOrderId}
          >
            {isCommitting ? MSG.BTN_COMMITTING : MSG.BTN_COMMIT}
          </Button>
        </div>
      </div>
    </AdaptiveSheet>
  );
}
