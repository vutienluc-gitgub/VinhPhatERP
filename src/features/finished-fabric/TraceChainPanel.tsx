import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { useTraceChain } from '@/application/inventory';
import { QUALITY_GRADE_LABELS } from '@/schema/finished-fabric.schema';

import type { FinishedFabricRoll } from './types';

type TraceChainPanelProps = {
  roll: FinishedFabricRoll;
  onClose: () => void;
};

const STATUS_LABELS: Record<string, string> = {
  in_stock: 'Trong kho',
  sold: 'Đã bán',
  reserved: 'Đã giữ',
  defective: 'Lỗi',
  draft: 'Nháp',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã hủy',
};

function fmtDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

function fmtNum(val: number | null, unit: string): string {
  if (val === null || val === undefined) return '—';
  return `${val.toLocaleString('vi-VN')} ${unit}`;
}

function fmtCurrency(val: number): string {
  return new Intl.NumberFormat('vi-VN').format(val) + ' đ';
}

export function TraceChainPanel({ roll, onClose }: TraceChainPanelProps) {
  const { data, isLoading } = useTraceChain(roll.raw_roll_id);

  const rawRoll = data?.rawRoll;
  const yarnReceipt = data?.yarnReceipt;

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title="🔗 Truy vết nguồn gốc"
      maxWidth={560}
    >
      {/* ── Chain timeline ── */}
      <div className="trace-chain">
        {/* Level 1: Cuộn thành phẩm */}
        <div className="trace-node trace-node--active">
          <div className="trace-node-icon">🏭</div>
          <div className="trace-node-body">
            <p className="trace-node-label">Cuộn thành phẩm</p>
            <p className="trace-node-title">{roll.roll_number}</p>
            <div className="trace-node-details">
              <span>{roll.fabric_type}</span>
              {roll.color_name && <span>{roll.color_name}</span>}
              {roll.quality_grade && (
                <span className={`grade-badge grade-${roll.quality_grade}`}>
                  {QUALITY_GRADE_LABELS[
                    roll.quality_grade as keyof typeof QUALITY_GRADE_LABELS
                  ] ?? roll.quality_grade}
                </span>
              )}
              <span>{fmtNum(roll.length_m, 'm')}</span>
              <span>{fmtNum(roll.weight_kg, 'kg')}</span>
            </div>
            {roll.warehouse_location && (
              <p className="trace-node-meta">📍 {roll.warehouse_location}</p>
            )}
          </div>
        </div>

        {/* Connector */}
        <div className="trace-connector" />

        {/* Level 2: Cuộn vải mộc */}
        {isLoading ? (
          <div className="trace-node trace-node--loading">
            <div className="trace-node-icon">⏳</div>
            <div className="trace-node-body">
              <p className="trace-node-label">Đang tải...</p>
            </div>
          </div>
        ) : rawRoll ? (
          <div className="trace-node">
            <div className="trace-node-icon">🧶</div>
            <div className="trace-node-body">
              <p className="trace-node-label">Cuộn vải mộc</p>
              <p className="trace-node-title">{rawRoll.roll_number}</p>
              <div className="trace-node-details">
                <span>{rawRoll.fabric_type}</span>
                {rawRoll.color_name && <span>{rawRoll.color_name}</span>}
                {rawRoll.quality_grade && (
                  <span
                    className={`grade-badge grade-${rawRoll.quality_grade}`}
                  >
                    {rawRoll.quality_grade}
                  </span>
                )}
                <span>{fmtNum(rawRoll.length_m, 'm')}</span>
                <span>{fmtNum(rawRoll.weight_kg, 'kg')}</span>
              </div>
              {rawRoll.lot_number && (
                <p className="trace-node-meta">📦 Lô: {rawRoll.lot_number}</p>
              )}
              {rawRoll.weaving_partner && (
                <p className="trace-node-meta">
                  🏠 Nhà dệt: {rawRoll.weaving_partner.name} (
                  {rawRoll.weaving_partner.code})
                </p>
              )}
              <p className="trace-node-meta">
                Trạng thái: {STATUS_LABELS[rawRoll.status] ?? rawRoll.status}
              </p>
            </div>
          </div>
        ) : (
          <div className="trace-node trace-node--empty">
            <div className="trace-node-icon">❓</div>
            <div className="trace-node-body">
              <p className="trace-node-label">Cuộn vải mộc</p>
              <p className="trace-node-meta">Không có liên kết cuộn mộc</p>
            </div>
          </div>
        )}

        {/* Connector */}
        {rawRoll && <div className="trace-connector" />}

        {/* Level 3: Phiếu nhập sợi */}
        {rawRoll &&
          (yarnReceipt ? (
            <div className="trace-node">
              <div className="trace-node-icon">📋</div>
              <div className="trace-node-body">
                <p className="trace-node-label">Phiếu nhập sợi</p>
                <p className="trace-node-title">{yarnReceipt.receipt_number}</p>
                <div className="trace-node-details">
                  <span>Ngày: {fmtDate(yarnReceipt.receipt_date)}</span>
                  <span>Giá trị: {fmtCurrency(yarnReceipt.total_amount)}</span>
                  <span>{yarnReceipt.items_count} dòng sợi</span>
                </div>
                {yarnReceipt.supplier && (
                  <p className="trace-node-meta">
                    🏢 NCC sợi: {yarnReceipt.supplier.name} (
                    {yarnReceipt.supplier.code})
                  </p>
                )}
                <p className="trace-node-meta">
                  Trạng thái:{' '}
                  {STATUS_LABELS[yarnReceipt.status] ?? yarnReceipt.status}
                </p>
              </div>
            </div>
          ) : (
            <div className="trace-node trace-node--empty">
              <div className="trace-node-icon">❓</div>
              <div className="trace-node-body">
                <p className="trace-node-label">Phiếu nhập sợi</p>
                <p className="trace-node-meta">
                  Không có liên kết phiếu nhập sợi
                </p>
              </div>
            </div>
          ))}
      </div>

      <div className="modal-footer mt-6 p-0 border-none">
        <button
          className="primary-button btn-standard ml-auto"
          type="button"
          onClick={onClose}
        >
          Đóng
        </button>
      </div>
    </AdaptiveSheet>
  );
}
