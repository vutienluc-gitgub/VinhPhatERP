import { useState } from 'react';
import { clsx } from 'clsx';

import { ApprovalRequest } from '@/domains/approval/models/types';
import { APPROVAL_STATUS } from '@/domains/approval/models/constants';
import { Icon } from '@/shared/components/Icon';

interface Props {
  request: ApprovalRequest;
  canApprove: boolean;
  canReject: boolean;
  onApprove: (comment: string) => Promise<void>;
  onReject: (comment: string) => Promise<void>;
  onDelegate?: (delegateeId: string, comment: string) => Promise<void>;
  className?: string;
}

export function ApprovalActions({
  request,
  canApprove,
  canReject,
  onApprove,
  onReject,
  onDelegate,
  className,
}: Props) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (request.status !== APPROVAL_STATUS.PENDING) return null;
  if (!canApprove && !canReject) return null;

  const handleAction = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && !comment.trim()) {
      setError('Vui lòng nhập lý do từ chối');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      if (action === 'approve') {
        await onApprove(comment);
      } else {
        await onReject(comment);
      }
      setComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelegate = async () => {
    const delegateeId = window.prompt('Nhập ID hoặc Tên user muốn ủy quyền:');
    if (!delegateeId) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onDelegate?.(delegateeId, comment);
      setComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={clsx(
        'flex flex-col gap-3 p-4 bg-surface-secondary rounded-lg border border-default',
        className,
      )}
    >
      <textarea
        className="w-full p-3 text-sm bg-background border border-default rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        placeholder="Nhập ghi chú / lý do (bắt buộc khi từ chối)..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        disabled={isSubmitting}
        rows={3}
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        {canApprove && onDelegate && (
          <button
            onClick={handleDelegate}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-foreground bg-surface hover:bg-surface-secondary border border-default rounded-md transition-colors disabled:opacity-50"
          >
            <Icon name="Forward" className="w-4 h-4" />
            Ủy quyền
          </button>
        )}
        {canReject && (
          <button
            onClick={() => handleAction('reject')}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-danger bg-danger-soft hover:bg-danger/20 rounded-md transition-colors disabled:opacity-50"
          >
            <Icon name="X" className="w-4 h-4" />
            Từ chối
          </button>
        )}

        {canApprove && (
          <button
            onClick={() => handleAction('approve')}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-inverse-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50"
          >
            <Icon name="Check" className="w-4 h-4" />
            Đồng ý duyệt
          </button>
        )}
      </div>
    </div>
  );
}
