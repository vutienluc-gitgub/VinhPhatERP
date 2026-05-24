import { Button } from '@/shared/components';

interface PORejectModalProps {
  rejectReason: string;
  setRejectReason: (val: string) => void;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function PORejectModal({
  rejectReason,
  setRejectReason,
  isPending,
  onClose,
  onConfirm,
}: PORejectModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl border border-border p-6 max-w-md w-full space-y-4">
        <h3 className="font-semibold text-lg text-gray-900 m-0">
          Từ chối Đơn đặt hàng
        </h3>
        <p className="text-sm text-gray-500">
          Vui lòng nhập lý do từ chối đơn đặt hàng này để phản hồi cho nhân viên
          phụ trách.
        </p>
        <div className="form-field">
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
            Lý do từ chối <span className="text-red-500">*</span>
          </label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Nhập lý do từ chối..."
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
            variant="danger"
            disabled={!rejectReason.trim() || isPending}
            isLoading={isPending}
            onClick={onConfirm}
          >
            Xác nhận từ chối
          </Button>
        </div>
      </div>
    </div>
  );
}
