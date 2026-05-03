import { useState } from 'react';

import { Button, AdaptiveSheet } from '@/shared/components';

type ContractSignSheetProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (signedFileUrl?: string) => void;
  isLoading: boolean;
};

export function ContractSignSheet({
  open,
  onClose,
  onConfirm,
  isLoading,
}: ContractSignSheetProps) {
  const [fileUrl, setFileUrl] = useState('');

  function handleClose() {
    setFileUrl('');
    onClose();
  }

  return (
    <AdaptiveSheet
      open={open}
      onClose={handleClose}
      title="Xác nhận hợp đồng đã ký"
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
            variant="success"
            onClick={() => onConfirm(fileUrl.trim() || undefined)}
            isLoading={isLoading}
          >
            Xác nhận đã ký
          </Button>
        </div>
      }
    >
      <div className="form-field">
        <label>URL file hợp đồng đã ký (tuỳ chọn)</label>
        <input
          type="text"
          className="field-input"
          placeholder="https://..."
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
        />
        <p className="field-hint text-xs text-muted mt-1">
          Đính kèm link file scan hợp đồng đã ký nếu có.
        </p>
      </div>
    </AdaptiveSheet>
  );
}
