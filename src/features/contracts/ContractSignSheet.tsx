import { useState, useEffect } from 'react';

import { Button, AdaptiveSheet } from '@/shared/components';

import { CONTRACT_LABELS } from './contracts.constants';

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

  useEffect(() => {
    if (open) {
      setFileUrl('');
    }
  }, [open]);

  return (
    <AdaptiveSheet
      open={open}
      onClose={onClose}
      title={CONTRACT_LABELS.SIGN_TITLE}
      maxWidth={480}
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {CONTRACT_LABELS.BTN_CLOSE}
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirm(fileUrl.trim() || undefined)}
            isLoading={isLoading}
          >
            {CONTRACT_LABELS.BTN_CONFIRM}
          </Button>
        </div>
      }
    >
      <div className="p-1">
        <input
          type="url"
          className="field-input"
          placeholder={CONTRACT_LABELS.SIGN_FILE_URL_PLACEHOLDER}
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
        />
      </div>
    </AdaptiveSheet>
  );
}
