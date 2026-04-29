import { useState } from 'react';

import { useProgressBoard, useUpdateStageStatus } from '@/application/orders';
import {
  PRODUCTION_STAGES,
  STAGE_LABELS,
} from '@/schema/order-progress.schema';

import { OpsLevelPath } from './OpsLevelPath';
import { ProgressExpBar } from './ProgressExpBar';
import { calculateOrderProgress } from './utils';
import type {
  OrderProgressWithOrder,
  ProductionStage,
  StageStatus,
} from './types';

type GroupedByOrder = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  fabricInfo: string;
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
        fabricInfo: isStandalone
          ? (row.work_orders?.bom_template?.name ?? '')
          : (row.orders?.order_items?.[0]?.fabric_type ?? ''),
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
        <span className="font-bold text-lg">Tiến độ đơn hàng</span>
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
              const pct = calculateOrderProgress(group.stages);

              return (
                <div
                  key={group.orderId}
                  className={`border rounded-sm p-3 ${overdue ? 'border-[#e74c3c44] bg-[#fef2f210]' : 'border-border bg-bg'}`}
                >
                  {/* Order header */}
                  <div className="grid grid-cols-[1fr_auto] gap-2 items-start mb-2">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <strong className="shrink-0">{group.orderNumber}</strong>
                      <span className="td-muted truncate max-w-full">
                        {group.customerName}
                      </span>
                      {group.fabricInfo && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-secondary-foreground truncate shrink-0 max-w-[120px]">
                          {group.fabricInfo}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-0.5 text-[0.82rem] shrink-0">
                      <span className="tabular-nums font-bold">{pct}%</span>
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

                  <ProgressExpBar percentage={pct} />

                  {/* Level Path Game Nodes */}
                  <OpsLevelPath
                    stages={group.stages}
                    isPendingUpdate={updateMutation.isPending}
                    onAdvance={handleQuickAdvance}
                  />
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
