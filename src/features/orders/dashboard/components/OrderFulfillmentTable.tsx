/**
 * OrderFulfillmentTable — Bảng chi tiết đơn hàng với progress bar inline.
 */
import { useState, useMemo } from 'react';

import { Badge, Icon } from '@/shared/components';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_BADGE_VARIANTS,
} from '@/schema/order.schema';
import type { OrderFulfillment } from '@/api/order-fulfillment.api';

import { FulfillmentProgressBar } from './FulfillmentProgressBar';
import { StageTimeline } from './StageTimeline';

interface OrderFulfillmentTableProps {
  data: OrderFulfillment[];
  isLoading: boolean;
}

type SortField =
  | 'order_number'
  | 'fulfillment_pct'
  | 'delivery_date'
  | 'customer_name';
type SortDir = 'asc' | 'desc';
type FilterKey = 'all' | 'overdue' | 'fulfilled' | 'in_progress';

export function OrderFulfillmentTable({
  data,
  isLoading,
}: OrderFulfillmentTableProps) {
  const [sortField, setSortField] = useState<SortField>('delivery_date');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filter, setFilter] = useState<FilterKey>('all');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Memoize filter counts to avoid recalculation per render
  const filterCounts = useMemo(
    () => ({
      all: data.length,
      in_progress: data.filter(
        (d) => d.fulfillment_pct > 0 && d.fulfillment_pct < 100,
      ).length,
      overdue: data.filter((d) => d.is_overdue).length,
      fulfilled: data.filter((d) => d.fulfillment_pct >= 100).length,
    }),
    [data],
  );

  const filteredData = useMemo(() => {
    switch (filter) {
      case 'overdue':
        return data.filter((d) => d.is_overdue);
      case 'fulfilled':
        return data.filter((d) => d.fulfillment_pct >= 100);
      case 'in_progress':
        return data.filter(
          (d) => d.fulfillment_pct > 0 && d.fulfillment_pct < 100,
        );
      default:
        return data;
    }
  }, [data, filter]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'order_number':
          return a.order_number.localeCompare(b.order_number) * dir;
        case 'fulfillment_pct':
          return (a.fulfillment_pct - b.fulfillment_pct) * dir;
        case 'delivery_date':
          return (
            (a.delivery_date ?? '').localeCompare(b.delivery_date ?? '') * dir
          );
        case 'customer_name':
          return (
            (a.customer_name ?? '').localeCompare(b.customer_name ?? '') * dir
          );
        default:
          return 0;
      }
    });
  }, [filteredData, sortField, sortDir]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return (
      <Icon
        name={sortDir === 'asc' ? 'ChevronUp' : 'ChevronDown'}
        size={12}
        className="inline ml-0.5"
      />
    );
  };

  const filterButtons: Array<{ key: FilterKey; label: string }> = [
    { key: 'all', label: 'Tất cả' },
    { key: 'in_progress', label: 'Đang SX' },
    { key: 'overdue', label: 'Trễ hạn' },
    { key: 'fulfilled', label: 'Đã giao đủ' },
  ];

  if (isLoading) {
    return (
      <div className="rounded-xl border border-zinc-100 bg-white p-8 flex items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-100 bg-white overflow-hidden">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 px-4 pt-4 pb-3 border-b border-zinc-50">
        {filterButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => setFilter(btn.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === btn.key
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'text-zinc-500 hover:bg-zinc-50'
            }`}
          >
            {btn.label}
            <span className="ml-1 text-[10px] opacity-60">
              {filterCounts[btn.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-zinc-500 bg-zinc-50/50">
              <th
                className="text-left py-2.5 px-4 font-semibold cursor-pointer hover:text-zinc-700"
                onClick={() => handleSort('order_number')}
              >
                Mã ĐH <SortIcon field="order_number" />
              </th>
              <th
                className="text-left py-2.5 px-4 font-semibold cursor-pointer hover:text-zinc-700"
                onClick={() => handleSort('customer_name')}
              >
                Khách hàng <SortIcon field="customer_name" />
              </th>
              <th className="text-left py-2.5 px-4 font-semibold">
                Trạng thái
              </th>
              <th
                className="text-left py-2.5 px-4 font-semibold cursor-pointer hover:text-zinc-700 min-w-[160px]"
                onClick={() => handleSort('fulfillment_pct')}
              >
                SX hoàn thành <SortIcon field="fulfillment_pct" />
              </th>
              <th className="text-left py-2.5 px-4 font-semibold">Lệnh SX</th>
              <th className="text-left py-2.5 px-4 font-semibold min-w-[120px]">
                Tiến độ
              </th>
              <th
                className="text-left py-2.5 px-4 font-semibold cursor-pointer hover:text-zinc-700"
                onClick={() => handleSort('delivery_date')}
              >
                Hạn giao <SortIcon field="delivery_date" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {sortedData.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-12 text-zinc-400 italic"
                >
                  Không có dữ liệu
                </td>
              </tr>
            )}
            {sortedData.map((row) => (
              <tr
                key={row.order_id}
                className={`hover:bg-zinc-50/50 transition-colors ${row.is_overdue ? 'bg-red-50/30' : ''}`}
              >
                <td className="py-2.5 px-4 font-bold text-zinc-800">
                  {row.order_number}
                </td>
                <td className="py-2.5 px-4 text-zinc-600 truncate max-w-[150px]">
                  {row.customer_name ?? '—'}
                </td>
                <td className="py-2.5 px-4">
                  <Badge
                    variant={
                      ORDER_STATUS_BADGE_VARIANTS[
                        row.order_status as keyof typeof ORDER_STATUS_BADGE_VARIANTS
                      ] ?? 'gray'
                    }
                    className="text-[10px] py-0 px-1.5 h-5"
                  >
                    {ORDER_STATUS_LABELS[
                      row.order_status as keyof typeof ORDER_STATUS_LABELS
                    ] ?? row.order_status}
                  </Badge>
                </td>
                <td className="py-2.5 px-4">
                  <FulfillmentProgressBar value={row.fulfillment_pct} />
                </td>
                <td className="py-2.5 px-4 text-zinc-500 tabular-nums">
                  <span className="font-bold text-zinc-700">
                    {row.wo_completed}
                  </span>
                  <span className="text-zinc-400">/{row.wo_count}</span>
                </td>
                <td className="py-2.5 px-4">
                  <StageTimeline
                    completedStages={row.completed_stages}
                    totalStages={row.total_stages}
                  />
                </td>
                <td className="py-2.5 px-4 tabular-nums">
                  {row.delivery_date ? (
                    <span
                      className={
                        row.is_overdue
                          ? 'text-red-600 font-bold'
                          : 'text-zinc-600'
                      }
                    >
                      {row.delivery_date.slice(5)}
                      {row.is_overdue && (
                        <Icon
                          name="TriangleAlert"
                          size={12}
                          className="inline ml-1 text-red-500"
                        />
                      )}
                    </span>
                  ) : (
                    <span className="text-zinc-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
