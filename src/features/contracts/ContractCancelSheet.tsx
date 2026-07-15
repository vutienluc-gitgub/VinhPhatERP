import { useState, useEffect } from 'react';

import { Button, AdaptiveSheet } from '@/shared/components';

import { CONTRACT_LABELS } from './contracts.constants';

type ContractCancelSheetProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
};

export function ContractCancelSheet({
  open,
  onClose,
  onConfirm,
  isLoading,
}: ContractCancelSheetProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) {
      setReason('');
    }
  }, [open]);

  return (
    <AdaptiveSheet
      open={open}
      onClose={onClose}
      title={CONTRACT_LABELS.CANCEL_TITLE}
      maxWidth={480}
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {CONTRACT_LABELS.BTN_CANCEL_ACTION}
          </Button>
          <Button
            variant="primary"
            className="btn-danger"
            onClick={() => onConfirm(reason)}
            isLoading={isLoading}
          >
            {CONTRACT_LABELS.BTN_CONFIRM_CANCEL}
          </Button>
        </div>
      }
    >
      <div className="p-1">
        <textarea
          className="field-textarea"
          rows={3}
          placeholder={CONTRACT_LABELS.CANCEL_REASON_PLACEHOLDER}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </AdaptiveSheet>
  );
}
