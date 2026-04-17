import { Button } from '@/shared/components';
type Props = {
  onRestore: () => void;
  onDiscard: () => void;
  hasConflict?: boolean;
};

export default function DraftBanner({
  onRestore,
  onDiscard,
  hasConflict,
}: Props) {
  return (
    <div
      className={`px-4 py-3 mb-4 rounded-lg flex justify-between items-center text-[0.9rem] border ${hasConflict ? 'bg-[rgba(239,68,68,0.1)] border-[var(--danger)]' : 'bg-[rgba(245,158,11,0.1)] border-[var(--warning)]'}`}
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold">
          {hasConflict ? '⚠️ Xung đột dữ liệu:' : '📝 Bản nháp:'}
        </span>
        <span>
          {hasConflict
            ? 'Có thay đổi mới từ tab khác, hãy cẩn thận khi lưu.'
            : 'Bạn có một bản nháp chưa hoàn thiện cho lệnh này.'}
        </span>
      </div>

      <div className="flex gap-2">
        {!hasConflict && (
          <Button
            variant="primary"
            className="btn-sm"
            type="button"
            onClick={onRestore}
          >
            Khôi phục
          </Button>
        )}
        <Button
          variant="secondary"
          className="btn-sm"
          type="button"
          onClick={onDiscard}
        >
          {hasConflict ? 'Bỏ qua' : 'Xóa bản nháp'}
        </Button>
      </div>
    </div>
  );
}
