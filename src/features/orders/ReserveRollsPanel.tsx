import { useCallback, useState } from 'react';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import {
  useAvailableRolls,
  useReservedRollsForOrder,
  useReserveRoll,
  useUnreserveRoll,
} from '@/application/orders';
import {
  calculateReservedLengthM,
  calculateReservedWeightKg,
} from '@/domain/orders';

import type { Order, OrderItem } from './types';

type ReserveRollsPanelProps = {
  order: Order;
  onClose: () => void;
};

function fmtNum(val: number | null, unit: string): string {
  if (val === null || val === undefined) return '—';
  return `${val.toLocaleString('vi-VN')} ${unit}`;
}

export function ReserveRollsPanel({ order, onClose }: ReserveRollsPanelProps) {
  const items = order.order_items ?? [];
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(
    items[0] ?? null,
  );

  const { data: reservedRolls = [], isLoading: loadingReserved } =
    useReservedRollsForOrder(order.id);

  const { data: availableRolls = [], isLoading: loadingAvailable } =
    useAvailableRolls(
      selectedItem?.fabric_type ?? '',
      selectedItem?.color_name ?? null,
    );

  const reserveMutation = useReserveRoll();
  const unreserveMutation = useUnreserveRoll();

  /**
   * Track which specific roll IDs have in-flight mutations.
   * Prevents double-click / concurrent operations on the same roll
   * which could cause double-allocation in a multi-user ERP.
   */
  const [pendingRollIds, setPendingRollIds] = useState<Set<string>>(new Set());

  // Filter out already reserved rolls from available list
  const reservedIds = new Set(reservedRolls.map((r) => r.id));
  const filteredAvailable = availableRolls.filter(
    (r) => !reservedIds.has(r.id),
  );

  // Calc totals for reserved rolls
  const reservedLengthM = calculateReservedLengthM(reservedRolls);
  const reservedWeightKg = calculateReservedWeightKg(reservedRolls);

  const handleReserve = useCallback(
    (rollId: string) => {
      if (pendingRollIds.has(rollId)) return;
      setPendingRollIds((prev) => new Set(prev).add(rollId));
      reserveMutation.mutate(
        { rollId, orderId: order.id },
        {
          onSettled: () => {
            setPendingRollIds((prev) => {
              const next = new Set(prev);
              next.delete(rollId);
              return next;
            });
          },
        },
      );
    },
    [pendingRollIds, reserveMutation, order.id],
  );

  const handleUnreserve = useCallback(
    (rollId: string) => {
      if (pendingRollIds.has(rollId)) return;
      setPendingRollIds((prev) => new Set(prev).add(rollId));
      unreserveMutation.mutate(rollId, {
        onSettled: () => {
          setPendingRollIds((prev) => {
            const next = new Set(prev);
            next.delete(rollId);
            return next;
          });
        },
      });
    },
    [pendingRollIds, unreserveMutation],
  );

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title={`🔒 Giữ cuộn — ${order.order_number}`}
    >
      <div className="flex flex-col gap-4">
        {/* Order items as filter tabs */}
        {items.length > 1 && (
          <div className="reserve-item-tabs">
            {items.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                className={`reserve-item-tab ${selectedItem?.id === item.id ? 'active' : ''}`}
                onClick={() => setSelectedItem(item)}
              >
                <span className="reserve-tab-label">Dòng {idx + 1}</span>
                <span className="reserve-tab-detail">
                  {item.fabric_type}
                  {item.color_name ? ` · ${item.color_name}` : ''}
                </span>
                <span className="reserve-tab-qty">
                  {new Intl.NumberFormat('vi-VN').format(item.quantity)}{' '}
                  {item.unit}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Single item info */}
        {items.length === 1 && selectedItem && (
          <div className="info-box">
            <strong>{selectedItem.fabric_type}</strong>
            {selectedItem.color_name && (
              <span> · {selectedItem.color_name}</span>
            )}
            <span className="td-muted">
              {' '}
              — Cần:{' '}
              {new Intl.NumberFormat('vi-VN').format(
                selectedItem.quantity,
              )}{' '}
              {selectedItem.unit}
            </span>
          </div>
        )}

        {/* Reserved rolls summary */}
        <div className="reserve-summary">
          <div className="reserve-summary-item">
            <span className="reserve-summary-label">Đã giữ</span>
            <span className="reserve-summary-value">
              {reservedRolls.length} cuộn
            </span>
          </div>
          <div className="reserve-summary-item">
            <span className="reserve-summary-label">Tổng dài</span>
            <span className="reserve-summary-value">
              {fmtNum(reservedLengthM, 'm')}
            </span>
          </div>
          <div className="reserve-summary-item">
            <span className="reserve-summary-label">Tổng nặng</span>
            <span className="reserve-summary-value">
              {fmtNum(reservedWeightKg, 'kg')}
            </span>
          </div>
        </div>

        {/* Reserved rolls table */}
        {reservedRolls.length > 0 && (
          <div>
            <h4 className="text-[0.88rem] mb-2">
              Cuộn đang giữ ({reservedRolls.length})
            </h4>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã cuộn</th>
                    <th>Loại vải</th>
                    <th>Dài</th>
                    <th>Nặng</th>
                    <th>CL</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {reservedRolls.map((roll) => (
                    <tr key={roll.id}>
                      <td>
                        <strong>{roll.roll_number}</strong>
                      </td>
                      <td className="td-muted">{roll.fabric_type}</td>
                      <td className="td-muted">{fmtNum(roll.length_m, 'm')}</td>
                      <td className="td-muted">
                        {fmtNum(roll.weight_kg, 'kg')}
                      </td>
                      <td>
                        {roll.quality_grade ? (
                          <span
                            className={`grade-badge grade-${roll.quality_grade}`}
                          >
                            {roll.quality_grade}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="td-actions">
                        <Button
                          variant="secondary"
                          type="button"
                          className="!text-[0.8rem] !px-[0.6rem] !py-[0.3rem]"
                          onClick={() => handleUnreserve(roll.id)}
                          disabled={pendingRollIds.has(roll.id)}
                        >
                          {pendingRollIds.has(roll.id)
                            ? 'Dang xu ly...'
                            : 'Bo giu'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Available rolls to reserve */}
        <div>
          <h4 className="text-[0.88rem] mb-2">
            Cuộn khả dụng
            {selectedItem && (
              <span className="td-muted">
                {' '}
                — {selectedItem.fabric_type}
                {selectedItem.color_name ? ` · ${selectedItem.color_name}` : ''}
              </span>
            )}
          </h4>

          {loadingAvailable || loadingReserved ? (
            <p className="table-empty">Đang tải...</p>
          ) : filteredAvailable.length === 0 ? (
            <p className="table-empty">
              Không có cuộn nào khả dụng
              {selectedItem ? ` cho "${selectedItem.fabric_type}"` : ''}.
            </p>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã cuộn</th>
                    <th className="hide-mobile">Màu</th>
                    <th>Dài</th>
                    <th>Nặng</th>
                    <th className="hide-mobile">CL</th>
                    <th className="hide-mobile">Vị trí</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAvailable.map((roll) => (
                    <tr key={roll.id}>
                      <td>
                        <strong>{roll.roll_number}</strong>
                      </td>
                      <td className="td-muted hide-mobile">
                        {roll.color_name ?? '—'}
                      </td>
                      <td className="td-muted">{fmtNum(roll.length_m, 'm')}</td>
                      <td className="td-muted">
                        {fmtNum(roll.weight_kg, 'kg')}
                      </td>
                      <td className="hide-mobile">
                        {roll.quality_grade ? (
                          <span
                            className={`grade-badge grade-${roll.quality_grade}`}
                          >
                            {roll.quality_grade}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="td-muted hide-mobile">
                        {roll.warehouse_location ?? '—'}
                      </td>
                      <td className="td-actions">
                        <button
                          className="primary-button !text-[0.8rem] !px-[0.6rem] !py-[0.3rem]"
                          type="button"
                          onClick={() => handleReserve(roll.id)}
                          disabled={pendingRollIds.has(roll.id)}
                        >
                          {pendingRollIds.has(roll.id)
                            ? 'Dang xu ly...'
                            : 'Giu'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {(reserveMutation.error || unreserveMutation.error) && (
          <p className="error-inline mt-3">
            Lỗi:{' '}
            {(() => {
              const err = reserveMutation.error ?? unreserveMutation.error;
              return err instanceof Error ? err.message : String(err);
            })()}
          </p>
        )}
      </div>

      {/* Footer using flex layout for responsiveness */}
      <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row sm:justify-end gap-3">
        <Button
          variant="secondary"
          className="w-full sm:w-auto justify-center"
          type="button"
          onClick={onClose}
        >
          Đóng
        </Button>
      </div>
    </AdaptiveSheet>
  );
}
