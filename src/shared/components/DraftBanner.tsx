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
      style={{
        background: hasConflict
          ? 'rgba(239, 68, 68, 0.1)'
          : 'rgba(245, 158, 11, 0.1)',
        border: `1px solid ${hasConflict ? 'var(--danger)' : 'var(--warning)'}`,
        padding: '12px 16px',
        marginBottom: '16px',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.9rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ fontWeight: 600 }}>
          {hasConflict ? '⚠️ Xung đột dữ liệu:' : '📝 Bản nháp:'}
        </span>
        <span>
          {hasConflict
            ? 'Có thay đổi mới từ tab khác, hãy cẩn thận khi lưu.'
            : 'Bạn có một bản nháp chưa hoàn thiện cho lệnh này.'}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
        }}
      >
        {!hasConflict && (
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={onRestore}
          >
            Khôi phục
          </button>
        )}
        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={onDiscard}
        >
          {hasConflict ? 'Bỏ qua' : 'Xóa nháp'}
        </button>
      </div>
    </div>
  );
}
