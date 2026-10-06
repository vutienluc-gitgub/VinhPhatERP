import { useState } from 'react';

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Button, Icon } from '@/shared/components';
import { MoneyText } from '@/shared/value';

export interface QuotationAcceptSheetProps {
  open: boolean;
  onClose: () => void;
  quotationNumber: string;
  totalAmount: number;
  onConfirm: () => void;
  isProcessing: boolean;
}

export function QuotationAcceptSheet({
  open,
  onClose,
  quotationNumber,
  totalAmount,
  onConfirm,
  isProcessing,
}: QuotationAcceptSheetProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <AdaptiveSheet
      open={open}
      onClose={onClose}
      title="Xác nhận đặt hàng"
      maxWidth={500}
      footer={
        <div className="flex gap-3 w-full">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isProcessing}
          >
            Quay lại
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={onConfirm}
            disabled={!termsAccepted || isProcessing}
          >
            <Icon name="Check" size={18} className="mr-2" />
            {isProcessing ? 'Đang xử lý...' : 'Xác nhận'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-muted-foreground py-2">
        <div className="bg-info-soft text-info p-4 rounded-lg flex items-start gap-3">
          <Icon name="Info" size={20} className="mt-0.5 shrink-0" />
          <p className="text-sm">
            Bạn đang xác nhận chuyển đổi báo giá{' '}
            <strong>{quotationNumber}</strong> thành đơn hàng chính thức với
            tổng giá trị{' '}
            <strong>
              <MoneyText value={totalAmount} />
            </strong>
            .
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer p-4 border border-default rounded-lg hover:bg-surface-secondary transition-colors mt-6">
          <input
            type="checkbox"
            className="mt-1 w-4 h-4 text-foreground rounded border-muted focus:ring-primary"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
          />
          <span className="text-sm select-none text-foreground">
            Tôi xác nhận đồng ý với các điều khoản, đơn giá và số lượng trong
            báo giá này.
          </span>
        </label>
      </div>
    </AdaptiveSheet>
  );
}
