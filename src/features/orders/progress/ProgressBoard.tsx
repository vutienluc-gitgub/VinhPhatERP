import { useState } from 'react';

import { useProgressBoard, useUpdateStageStatus } from '@/application/orders';

import {
  PRODUCTION_STAGES,
  STAGE_LABELS,
  STAGE_STATUS_LABELS,
} from './order-progress.module';
import type {
  OrderProgressWithOrder,
  ProductionStage,
  StageStatus,
} from './types';

type GroupedByOrder = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  deliveryDate: string | null;
  stages: OrderProgressWithOrder[];
};

function groupByOrder(rows: OrderProgressWithOrder[]): GroupedByOrder[] {
  const map = new Map<string, GroupedByOrder>();
  for (const row of rows) {
    const groupKey = row.order_id ?? row.work_order_id ?? row.id;
    let group = map.get(groupKey);
    if (!group) {
      const isStandalone = !row.order_id && row.work_order_id;
      group = {
        orderId: groupKey,
        orderNumber: isStandalone
          ? (row.work_orders?.work_order_number ?? '—')
          : (row.orders?.order_number ?? '—'),
        customerName: isStandalone
          ? (row.work_orders?.supplier?.name ?? 'LSX độc lập')
          : (row.orders?.customers?.name ?? '—'),
        deliveryDate: isStandalone ? null : (row.orders?.delivery_date ?? null),
        stages: [],
      };
      map.set(groupKey, group);
    }
    group.stages.push(row);
  }
  return Array.from(map.values());
}

function isOverdue(deliveryDate: string | null): boolean {
  if (!deliveryDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(deliveryDate) < today;
}

export function ProgressBoard() {
  const { data: allProgress = [], isLoading, error } = useProgressBoard();
  const updateMutation = useUpdateStageStatus();
  const [stageFilter, setStageFilter] = useState<ProductionStage | ''>('');
  const [statusFilter, setStatusFilter] = useState<StageStatus | ''>('');

  const grouped = groupByOrder(allProgress);

  // Filter orders based on selected stage+status
  const filtered = grouped.filter((group) => {
    if (!stageFilter && !statusFilter) return true;
    return group.stages.some((s) => {
      if (stageFilter && s.stage !== stageFilter) return false;
      if (statusFilter && s.status !== statusFilter) return false;
      return true;
    });
  });

  function handleQuickAdvance(row: OrderProgressWithOrder) {
    if (row.status === 'done' || row.status === 'skipped') return;
    const nextStatus: StageStatus =
      row.status === 'pending' ? 'in_progress' : 'done';
    updateMutation.mutate({
      progressId: row.id,
      status: nextStatus,
    });
  }

  if (error) {
    return (
      <div className="panel-card">
        <p className="text-[#c0392b] p-4">Lỗi: {(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Sản xuất</p>
            <h3>Tiến độ đơn hàng</h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar card-filter-section">
        <div className="filter-field">
          <label htmlFor="stage-filter">Công đoạn</label>
          <select
            id="stage-filter"
            className="field-select"
            value={stageFilter}
            onChange={(e) =>
              setStageFilter(e.target.value as ProductionStage | '')
            }
          >
            <option value="">Tất cả</option>
            {PRODUCTION_STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="status-filter">Trạng thái</label>
          <select
            id="status-filter"
            className="field-select"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as StageStatus | '')
            }
          >
            <option value="">Tất cả</option>
            <option value="pending">Chờ xử lý</option>
            <option value="in_progress">Đang làm</option>
            <option value="done">Hoàn thành</option>
            <option value="skipped">Bỏ qua</option>
          </select>
        </div>

        {(stageFilter || statusFilter) && (
          <button
            className="btn-secondary self-end"
            type="button"
            onClick={() => {
              setStageFilter('');
              setStatusFilter('');
            }}
          >
            ✕ Xóa lọc
          </button>
        )}
      </div>

      {/* Board */}
      <div className="px-5 pb-5">
        {isLoading ? (
          <p className="table-empty">Đang tải...</p>
        ) : filtered.length === 0 ? (
          <p className="table-empty">
            {stageFilter || statusFilter
              ? 'Không tìm thấy đơn hàng phù hợp.'
              : 'Chưa có đơn hàng nào được xác nhận.'}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((group) => {
              const overdue = isOverdue(group.deliveryDate);
              const doneCount = group.stages.filter(
                (s) => s.status === 'done',
              ).length;
              const totalCount = group.stages.filter(
                (s) => s.status !== 'skipped',
              ).length;
              const pct =
                totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

              return (
                <div
                  key={group.orderId}
                  className={`border rounded-sm p-3 ${overdue ? 'border-[#e74c3c44] bg-[#fef2f210]' : 'border-border bg-bg'}`}
                >
                  {/* Order header */}
                  <div className="flex justify-between items-center mb-2 flex-wrap gap-[0.4rem]">
                    <div>
                      <strong>{group.orderNumber}</strong>
                      <span className="td-muted ml-2">
                        {group.customerName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[0.82rem]">
                      <span className="tabular-nums">{pct}%</span>
                      {group.deliveryDate && (
                        <span
                          className={
                            overdue ? 'text-[#c0392b]' : 'text-muted-foreground'
                          }
                        >
                          📅 {group.deliveryDate}
                          {overdue && ' ⚠️'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mini progress bar */}
                  <div className="h-1 bg-border rounded-[2px] mb-2">
                    <div
                      className="h-full rounded-[2px] transition-[width] duration-300 ease-in-out"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: pct === 100 ? '#0c8f68' : '#0b6bcb',
                      }}
                    />
                  </div>

                  {/* Stage chips */}
                  <div className="flex flex-wrap gap-[0.3rem]">
                    {PRODUCTION_STAGES.map((stageKey) => {
                      const row = group.stages.find(
                        (s) => s.stage === stageKey,
                      );
                      if (!row) return null;
                      const statusCls =
                        row.status === 'done'
                          ? 'in_stock'
                          : row.status === 'in_progress'
                            ? 'in_process'
                            : row.status === 'skipped'
                              ? 'damaged'
                              : 'shipped';
                      const clickable =
                        row.status !== 'done' && row.status !== 'skipped';

                      return (
                        <button
                          key={row.id}
                          type="button"
                          className={`roll-status ${statusCls} ${clickable ? 'cursor-pointer' : 'cursor-default'} text-[0.72rem] border-none`}
                          disabled={updateMutation.isPending || !clickable}
                          onClick={() => clickable && handleQuickAdvance(row)}
                          title={`${STAGE_LABELS[stageKey]}: ${STAGE_STATUS_LABELS[row.status]}${clickable ? ' — Nhấn để chuyển trạng thái' : ''}`}
                        >
                          {STAGE_LABELS[stageKey]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {updateMutation.error && (
        <p className="text-[#c0392b] text-[0.85rem] px-5 pb-4">
          Lỗi cập nhật: {(updateMutation.error as Error).message}
        </p>
      )}
    </div>
  );
}
