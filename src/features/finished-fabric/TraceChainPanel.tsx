import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { useTraceChain } from '@/application/inventory';
import { QUALITY_GRADE_LABELS } from '@/schema/finished-fabric.schema';
import { formatQuantity, formatCurrency } from '@/shared/value/core/formatter';
import type { FinishedFabricRoll } from '@/domain/inventory/finished-fabric.types';

import { FINISHED_FABRIC_TRACE_LABELS as MSG } from './finished-fabric.constants';

type TraceChainPanelProps = {
  roll: FinishedFabricRoll;
  onClose: () => void;
};

function fmtDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

function fmtNum(val: number | null, unit: string): string {
  if (val === null || val === undefined) return '—';
  return `${formatQuantity(val)} ${unit}`;
}

function fmtCurrency(val: number): string {
  // eslint-disable-next-line no-restricted-syntax
  return formatCurrency(val) + ' đ';
}

export function TraceChainPanel({ roll, onClose }: TraceChainPanelProps) {
  const { data, isLoading } = useTraceChain(roll.raw_roll_id);

  const rawRoll = data?.rawRoll;
  const yarnReceipt = data?.yarnReceipt;

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title="{MSG.TITLE}"
      maxWidth={560}
      footer={
        <button
          className="primary-button btn-standard ml-auto"
          type="button"
          onClick={onClose}
        >
          {MSG.BTN_CLOSE}
        </button>
      }
    >
      {/* ── Chain timeline ── */}
      <div className="trace-chain">
        {/* Level 1: Cuộn thành phẩm */}
        <div className="trace-node trace-node--active">
          <div className="trace-node-icon">🏭</div>
          <div className="trace-node-body">
            <p className="trace-node-label">{MSG.NODE_FINISHED}</p>
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
              <p className="trace-node-label">{MSG.LOADING}</p>
            </div>
          </div>
        ) : rawRoll ? (
          <div className="trace-node">
            <div className="trace-node-icon">🧶</div>
            <div className="trace-node-body">
              <p className="trace-node-label">{MSG.NODE_RAW}</p>
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
                <p className="trace-node-meta">
                  {MSG.LBL_LOT} {rawRoll.lot_number}
                </p>
              )}
              {rawRoll.weaving_partner && (
                <p className="trace-node-meta">
                  {MSG.LBL_WEAVER} {rawRoll.weaving_partner.name} (
                  {rawRoll.weaving_partner.code})
                </p>
              )}
              <p className="trace-node-meta">
                {MSG.LBL_STATUS} {MSG.STATUS[rawRoll.status] ?? rawRoll.status}
              </p>
            </div>
          </div>
        ) : (
          <div className="trace-node trace-node--empty">
            <div className="trace-node-icon">❓</div>
            <div className="trace-node-body">
              <p className="trace-node-label">{MSG.NODE_RAW}</p>
              <p className="trace-node-meta">{MSG.EMPTY_RAW}</p>
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
                <p className="trace-node-label">{MSG.NODE_YARN}</p>
                <p className="trace-node-title">{yarnReceipt.receipt_number}</p>
                <div className="trace-node-details">
                  <span>
                    {MSG.LBL_DATE} {fmtDate(yarnReceipt.receipt_date)}
                  </span>
                  <span>
                    {MSG.LBL_VALUE} {fmtCurrency(yarnReceipt.total_amount)}
                  </span>
                  <span>
                    {yarnReceipt.items_count} {MSG.LBL_YARN_LINES}
                  </span>
                </div>
                {yarnReceipt.supplier && (
                  <p className="trace-node-meta">
                    {MSG.LBL_SUPPLIER} {yarnReceipt.supplier.name} (
                    {yarnReceipt.supplier.code})
                  </p>
                )}
                <p className="trace-node-meta">
                  Trạng thái:{' '}
                  {MSG.STATUS[yarnReceipt.status] ?? yarnReceipt.status}
                </p>
              </div>
            </div>
          ) : (
            <div className="trace-node trace-node--empty">
              <div className="trace-node-icon">❓</div>
              <div className="trace-node-body">
                <p className="trace-node-label">{MSG.NODE_YARN}</p>
                <p className="trace-node-meta">
                  Không có liên kết phiếu nhập sợi
                </p>
              </div>
            </div>
          ))}
      </div>
    </AdaptiveSheet>
  );
}
