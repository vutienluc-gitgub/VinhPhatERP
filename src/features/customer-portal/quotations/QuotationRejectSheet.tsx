import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Button } from '@/shared/components';

export interface QuotationRejectSheetProps {
  open: boolean;
  onClose: () => void;
  reason: string;
  onReasonChange: (val: string) => void;
  onConfirm: () => void;
  isProcessing: boolean;
}

export function QuotationRejectSheet({
  open,
  onClose,
  reason,
  onReasonChange,
  onConfirm,
  isProcessing,
}: QuotationRejectSheetProps) {
  return (
    <AdaptiveSheet
      open={open}
      onClose={onClose}
      title="Từ chối báo giá"
      maxWidth={500}
      footer={
        <div className="flex gap-3 w-full">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isProcessing}
          >
            Hủy
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? 'Đang xử lý...' : 'Xác nhận từ chối'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-2">
        <p className="text-sm text-muted-foreground">
          Vui lòng cho chúng tôi biết lý do bạn từ chối báo giá này để Vĩnh Phát
          có thể cải thiện chất lượng dịch vụ:
        </p>
        <textarea
          className="w-full border border-default rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none bg-surface text-foreground"
          rows={4}
          placeholder="Ví dụ: Đơn giá cao, thời gian giao hàng lâu..."
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
        />
      </div>
    </AdaptiveSheet>
  );
}
