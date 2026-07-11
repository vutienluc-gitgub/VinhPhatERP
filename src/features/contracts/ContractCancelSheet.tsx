import { useState } from 'react';

import { Button, AdaptiveSheet } from '@/shared/components';

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
  const [touched, setTouched] = useState(false);
  const hasError = touched && !reason.trim();

  function handleSubmit() {
    setTouched(true);
    if (!reason.trim()) return;
    onConfirm(reason.trim());
  }

  function handleClose() {
    setReason('');
    setTouched(false);
    onClose();
  }

  return (
    <AdaptiveSheet
      open={open}
      onClose={handleClose}
      title="Hủy hợp đồng"
      footer={
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Thoát
          </Button>
          <Button variant="danger" onClick={handleSubmit} isLoading={isLoading}>
            Xác nhận huỷ
          </Button>
        </div>
      }
    >
      <div className="form-field">
        <label>
          Lý do huỷ <span className="field-required">*</span>
        </label>
        <textarea
          className={`field-textarea${hasError ? ' border-danger' : ''}`}
          rows={4}
          placeholder="Nhập lý do huỷ hợp đồng..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => setTouched(true)}
        />
        {hasError && (
          <span className="field-error">Vui lòng nhập lý do huỷ hợp đồng.</span>
        )}
      </div>
    </AdaptiveSheet>
  );
}
