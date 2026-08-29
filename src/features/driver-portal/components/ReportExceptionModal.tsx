import { useState } from 'react';

import { Icon } from '@/shared/components';
import type {
  DeliveryExceptionType,
  ExceptionResolutionAction,
} from '@/domain/logistics';
import { useDeliveryException } from '@/features/driver-portal/hooks/useDeliveryException';

export interface ReportExceptionModalProps {
  open: boolean;
  onClose: () => void;
  attemptId: string;
}

const EXCEPTION_OPTIONS: Array<{
  type: DeliveryExceptionType;
  label: string;
  desc: string;
  defaultAction: ExceptionResolutionAction;
}> = [
  {
    type: 'CUSTOMER_ABSENT',
    label: 'Khách vắng mặt',
    desc: 'Đến nơi nhưng không có người nhận tại địa chỉ',
    defaultAction: 'RETRY_NEXT_DAY',
  },
  {
    type: 'CONTACT_UNREACHABLE',
    label: 'Không liên lạc được',
    desc: 'Gọi điện nhiều lần nhưng thuê bao hoặc không nghe máy',
    defaultAction: 'RETRY_NEXT_DAY',
  },
  {
    type: 'WRONG_ADDRESS',
    label: 'Sai địa chỉ giao',
    desc: 'Địa chỉ trên phiếu giao không chính xác hoặc không tìm thấy',
    defaultAction: 'REDISPATCH',
  },
  {
    type: 'REJECTED_DEFECT',
    label: 'Khách từ chối nhận',
    desc: 'Khách kiểm tra và từ chối do sai mẫu hoặc lỗi vải',
    defaultAction: 'RETURN_WAREHOUSE',
  },
  {
    type: 'FORCE_MAJEURE',
    label: 'Sự cố bất khả kháng',
    desc: 'Sự cố phương tiện, ngập lụt hoặc thời tiết xấu',
    defaultAction: 'RETURN_WAREHOUSE',
  },
];

export function ReportExceptionModal({
  open,
  onClose,
  attemptId,
}: ReportExceptionModalProps) {
  const [selectedType, setSelectedType] =
    useState<DeliveryExceptionType>('CUSTOMER_ABSENT');
  const [reasonDetail, setReasonDetail] = useState('');
  const exceptionMutation = useDeliveryException();

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reasonDetail.trim()) return;

    const opt = EXCEPTION_OPTIONS.find((o) => o.type === selectedType);

    await exceptionMutation.mutateAsync({
      attemptId,
      exceptionType: selectedType,
      reasonDetail: reasonDetail.trim(),
      resolutionAction: opt?.defaultAction ?? 'RETRY_NEXT_DAY',
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2 text-[var(--destructive)]">
            <Icon name="AlertTriangle" size={20} />
            <h3 className="font-bold text-base text-[var(--foreground)]">
              Báo cáo sự cố giao hàng
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)]"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Exception Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--foreground)]">
              Chọn loại sự cố:
            </label>
            <div className="space-y-1.5">
              {EXCEPTION_OPTIONS.map((opt) => (
                <label
                  key={opt.type}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedType === opt.type
                      ? 'border-[var(--primary)] bg-[var(--primary-subtle)]'
                      : 'border-[var(--border)] bg-[var(--surface-secondary)] hover:bg-[var(--surface)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="exceptionType"
                    value={opt.type}
                    checked={selectedType === opt.type}
                    onChange={() => setSelectedType(opt.type)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {opt.label}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {opt.desc}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">
              Chi tiết lý do / Ghi chú điều phối:
            </label>
            <textarea
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              required
              rows={3}
              placeholder="Nhập mô tả cụ thể về sự cố..."
              className="w-full p-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[var(--border)] font-medium text-sm text-[var(--foreground)] hover:bg-[var(--surface-secondary)]"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={exceptionMutation.isPending || !reasonDetail.trim()}
              className="flex-1 py-2.5 rounded-xl bg-[var(--destructive)] text-[var(--destructive-foreground)] font-bold text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {exceptionMutation.isPending ? (
                <Icon name="Loader2" size={16} className="animate-spin" />
              ) : (
                <Icon name="Send" size={16} />
              )}
              <span>Gửi báo cáo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
