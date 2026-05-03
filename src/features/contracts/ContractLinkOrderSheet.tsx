import { useState } from 'react';

import { Button, AdaptiveSheet } from '@/shared/components';
import { Combobox } from '@/shared/components/Combobox';
import { useAvailableOrders } from '@/application/contracts';

type ContractLinkOrderSheetProps = {
  open: boolean;
  onClose: () => void;
  onLink: (orderId: string) => void;
  isLoading: boolean;
  linkedOrderIds: string[];
};

export function ContractLinkOrderSheet({
  open,
  onClose,
  onLink,
  isLoading,
  linkedOrderIds,
}: ContractLinkOrderSheetProps) {
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [touched, setTouched] = useState(false);
  const hasError = touched && !selectedOrderId;

  const { data: orderOptions = [] } = useAvailableOrders(linkedOrderIds);

  function handleSubmit() {
    setTouched(true);
    if (!selectedOrderId) return;
    onLink(selectedOrderId);
  }

  function handleClose() {
    setSelectedOrderId('');
    setTouched(false);
    onClose();
  }

  return (
    <AdaptiveSheet
      open={open}
      onClose={handleClose}
      title="Liên kết đơn hàng"
      footer={
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Thoát
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            Liên kết
          </Button>
        </div>
      }
    >
      <div className="form-field">
        <label>
          Đơn hàng <span className="field-required">*</span>
        </label>
        <Combobox
          options={orderOptions}
          value={selectedOrderId}
          onChange={(val) => setSelectedOrderId(val as string)}
          placeholder="Tìm kiếm số đơn hàng hoặc tên khách hàng..."
          hasError={hasError}
        />
        {hasError && (
          <span className="field-error">Vui lòng chọn đơn hàng.</span>
        )}
        <p className="field-hint text-xs text-muted mt-1">
          Chỉ hiển thị đơn hàng chưa bị huỷ và chưa được liên kết.
        </p>
      </div>
    </AdaptiveSheet>
  );
}
