import { useState } from 'react';

import { Button, AdaptiveSheet } from '@/shared/components';
import { Combobox } from '@/shared/components/Combobox';
import { useAvailableOrders } from '@/application/contracts';

import { CONTRACT_LABELS } from './contracts.constants';

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
      title={CONTRACT_LABELS.LINK_ORDER_TITLE}
      footer={
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            {CONTRACT_LABELS.BTN_CLOSE}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            {CONTRACT_LABELS.BTN_LINK}
          </Button>
        </div>
      }
    >
      <div className="form-field">
        <label>
          {CONTRACT_LABELS.ORDER} <span className="field-required">*</span>
        </label>
        <Combobox
          options={orderOptions}
          value={selectedOrderId}
          onChange={(val) => setSelectedOrderId(val as string)}
          placeholder={CONTRACT_LABELS.LINK_ORDER_SELECT}
          hasError={hasError}
        />
        {hasError && (
          <span className="field-error">
            {CONTRACT_LABELS.LINK_ORDER_SELECT}
          </span>
        )}
      </div>
    </AdaptiveSheet>
  );
}
