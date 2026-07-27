import { Button } from '@/shared/components';

interface PORejectModalProps {
  rejectReason: string;
  setRejectReason: (val: string) => void;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isRequestChanges?: boolean;
}

export function PORejectModal({
  rejectReason,
  setRejectReason,
  isPending,
  onClose,
  onConfirm,
  isRequestChanges,
}: PORejectModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl border border-border p-6 max-w-md w-full space-y-4">
        <h3 className="font-semibold text-lg text-foreground m-0">
          {isRequestChanges
            ? 'Yêu cầu sửa đổi Đơn đặt hàng'
            : 'Từ chối Đơn đặt hàng'}
        </h3>
        <p className="text-sm text-muted">
          {isRequestChanges
            ? 'Vui lòng nhập chi tiết các yêu cầu sửa đổi để nhân viên cập nhật lại PO.'
            : 'Vui lòng nhập lý do từ chối đơn đặt hàng này để phản hồi cho nhân viên phụ trách.'}
        </p>
        <div className="form-field">
          <label className="text-xs font-bold text-muted uppercase tracking-wider">
            {isRequestChanges ? 'Chi tiết yêu cầu' : 'Lý do từ chối'}{' '}
            <span className="text-danger">*</span>
          </label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={
              isRequestChanges
                ? 'Nhập chi tiết yêu cầu...'
                : 'Nhập lý do từ chối...'
            }
            className="field-input min-h-[100px] w-full p-2 border border-border rounded-lg"
            rows={3}
            required
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            variant={isRequestChanges ? 'primary' : 'danger'}
            disabled={!rejectReason.trim() || isPending}
            isLoading={isPending}
            onClick={onConfirm}
          >
            {isRequestChanges ? 'Gửi yêu cầu' : 'Xác nhận từ chối'}
          </Button>
        </div>
      </div>
    </div>
  );
}
