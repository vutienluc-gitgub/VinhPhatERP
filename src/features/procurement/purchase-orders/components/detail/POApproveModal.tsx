import { useState } from 'react';

import { Button } from '@/shared/components';
import { PO_CONSTANTS } from '@/features/procurement/purchase-orders/purchase-orders.constants';

interface POApproveModalProps {
  approveComment: string;
  setApproveComment: (val: string) => void;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (sendImmediately: boolean) => void;
}

export function POApproveModal({
  approveComment,
  setApproveComment,
  isPending,
  onClose,
  onConfirm,
}: POApproveModalProps) {
  const [sendImmediately, setSendImmediately] = useState(true);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl border border-border p-6 max-w-md w-full space-y-4">
        <h3 className="font-semibold text-lg text-foreground m-0">
          {PO_CONSTANTS.MODAL_APPROVE_TITLE}
        </h3>
        <p className="text-sm text-muted">{PO_CONSTANTS.MODAL_APPROVE_DESC}</p>
        <div className="form-field">
          <label className="text-xs font-bold text-muted uppercase tracking-wider">
            {PO_CONSTANTS.MODAL_APPROVE_NOTE_LABEL}
          </label>
          <textarea
            value={approveComment}
            onChange={(e) => setApproveComment(e.target.value)}
            placeholder={PO_CONSTANTS.MODAL_APPROVE_NOTE_PLACEHOLDER}
            className="field-input min-h-[100px] w-full p-2 border border-border rounded-lg"
            rows={3}
          />
        </div>
        <div className="flex items-center gap-2 py-1">
          <input
            type="checkbox"
            id="send-immediately"
            checked={sendImmediately}
            onChange={(e) => setSendImmediately(e.target.checked)}
            className="w-4 h-4 text-primary border-muted rounded focus:ring-primary"
          />
          <label
            htmlFor="send-immediately"
            className="text-sm text-secondary select-none cursor-pointer"
          >
            {PO_CONSTANTS.MODAL_APPROVE_AUTO_SEND}
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            {PO_CONSTANTS.MODAL_APPROVE_CANCEL}
          </Button>
          <Button
            variant="primary"
            disabled={isPending}
            isLoading={isPending}
            onClick={() => onConfirm(sendImmediately)}
          >
            {PO_CONSTANTS.MODAL_APPROVE_CONFIRM}
          </Button>
        </div>
      </div>
    </div>
  );
}
