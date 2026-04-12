/**
 * AnomalyLegend — chỉ hiện 2 màu bất thường (light/heavy).
 * "Bình thường" không cần legend vì là trạng thái mặc định.
 * Dùng tooltip để giải thích thay vì label text.
 */
export function AnomalyLegend() {
  return (
    <div className="flex items-center gap-2">
      <span
        style={{
          fontSize: 10,
          color: 'var(--muted)',
          fontWeight: 500,
        }}
      >
        Màu:
      </span>
      <span
        className="relative group/tip flex items-center gap-1"
        style={{ cursor: 'default' }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: 2,
            background: 'rgba(239,68,68,0.15)',
            border: '1.5px solid #ef4444',
          }}
        />
        <span
          style={{
            fontSize: 10,
            color: 'var(--muted)',
          }}
        >
          Nhẹ
        </span>
        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50 opacity-0 group-hover/tip:opacity-100 transition-opacity whitespace-nowrap rounded px-2 py-1 text-[10px] bg-gray-900 text-white">
          Nhẹ hơn chuẩn
        </span>
      </span>
      <span
        className="relative group/tip flex items-center gap-1"
        style={{ cursor: 'default' }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: 2,
            background: 'rgba(249,115,22,0.15)',
            border: '1.5px solid #f97316',
          }}
        />
        <span
          style={{
            fontSize: 10,
            color: 'var(--muted)',
          }}
        >
          Nặng
        </span>
        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50 opacity-0 group-hover/tip:opacity-100 transition-opacity whitespace-nowrap rounded px-2 py-1 text-[10px] bg-gray-900 text-white">
          Nặng hơn chuẩn
        </span>
      </span>
    </div>
  );
}
