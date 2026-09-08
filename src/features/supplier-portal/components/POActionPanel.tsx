import { useState } from 'react';

import { Button, Icon } from '@/shared/components';
import { SUPPLIER_PORTAL_LABELS } from '@/features/supplier-portal/supplier-portal.constants';

const TEXT = SUPPLIER_PORTAL_LABELS;

export interface POActionPanelProps {
  onConfirm: () => void;
  onReject: (reason: string) => void;
  isConfirming?: boolean;
  isRejecting?: boolean;
}

export function POActionPanel({
  onConfirm,
  onReject,
  isConfirming = false,
  isRejecting = false,
}: POActionPanelProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border p-5 md:p-6">
      <h3 className="font-semibold mb-2 text-center text-foreground">
        {TEXT.PO_RESPONSE_TITLE}
      </h3>
      <p className="text-sm text-muted-foreground mb-5 text-center">
        {TEXT.PO_RESPONSE_DESC}
      </p>

      {!showRejectForm ? (
        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            className="w-full justify-center text-lg font-bold py-6 min-h-[48px] touch-manipulation"
            onClick={onConfirm}
            isLoading={isConfirming}
          >
            <Icon name="CheckCircle" size={20} className="mr-2" />
            {TEXT.PO_CONFIRM_BTN}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full justify-center text-danger border-danger/30 hover:bg-danger-soft min-h-[48px] touch-manipulation"
            onClick={() => setShowRejectForm(true)}
          >
            <Icon name="XCircle" size={18} className="mr-2" />
            {TEXT.PO_CANNOT_FULFILL}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-danger-soft/50 border border-danger/20 rounded-lg p-4">
            <label
              htmlFor="reject-reason"
              className="block text-sm font-semibold text-danger mb-2"
            >
              {TEXT.PO_REJECT_REASON_LABEL}{' '}
              <span className="text-danger">*</span>
            </label>
            <textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={TEXT.PO_REJECT_REASON_PLACEHOLDER}
              rows={3}
              className="w-full border border-danger/30 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-danger/50 resize-none bg-surface text-foreground"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="w-full justify-center min-h-[44px]"
              onClick={() => {
                setShowRejectForm(false);
                setRejectReason('');
              }}
            >
              {TEXT.PO_BTN_BACK}
            </Button>
            <Button
              variant="danger"
              className="w-full justify-center min-h-[44px]"
              onClick={() => onReject(rejectReason.trim())}
              isLoading={isRejecting}
              disabled={!rejectReason.trim()}
            >
              <Icon name="Send" size={16} className="mr-2" />
              {TEXT.PO_BTN_SEND_RESPONSE}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
