import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { DataTable } from '@/shared/components/DataTable';
import { TableSkeleton } from '@/shared/components/TableSkeleton';
import { KpiCard } from '@/shared/components/KpiCard';
import { Badge } from '@/shared/components/Badge';
import { FilterChips } from '@/shared/components/FilterChips';
import { formatQuantity } from '@/shared/value/core/formatter';
import type { WorkOrderRow } from '@/api/supplier-work-orders.api';

import { useWorkOrders } from './hooks/useWorkOrders';

const STATUS_FILTERS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Chờ thực hiện', value: 'yarn_issued' },
  { label: 'Đang chạy', value: 'in_progress' },
  { label: 'Chờ nghiệm thu', value: 'pending_verification' },
  { label: 'Đã xong', value: 'completed' },
];

export function SupplierWorkOrderListPage() {
  const navigate = useNavigate();
  const { data: workOrders, isLoading, isError } = useWorkOrders();
  const [filter, setFilter] = useState('all');

  const filteredData = useMemo(() => {
    if (!workOrders) return [];
    if (filter === 'all') return workOrders;
    return workOrders.filter((wo) => wo.status === filter);
  }, [workOrders, filter]);

  const kpis = useMemo(() => {
    if (!workOrders)
      return { pending: 0, running: 0, verifying: 0, completed: 0 };
    return {
      pending: workOrders.filter((wo) => wo.status === 'yarn_issued').length,
      running: workOrders.filter((wo) => wo.status === 'in_progress').length,
      verifying: workOrders.filter(
        (wo) => wo.status === ('pending_verification' as string),
      ).length,
      completed: workOrders.filter((wo) => wo.status === 'completed').length,
    };
  }, [workOrders]);

  const columns = [
    {
      header: 'Mã Lệnh',
      cell: (item: WorkOrderRow) => {
        return (
          <span className="font-medium">
            WO-{item.id.split('-')[0]!.toUpperCase()}
          </span>
        );
      },
    },
    {
      header: 'Sản lượng',
      cell: (item: WorkOrderRow) => {
        const qty = item.target_quantity;
        const unit = item.target_unit || 'm';
        return (
          <span>
            {formatQuantity(qty)} {unit}
          </span>
        );
      },
    },
    {
      header: 'Hạn hoàn thành',
      cell: (item: WorkOrderRow) => {
        const date = item.end_date;
        return date ? new Date(date).toLocaleDateString('vi-VN') : '-';
      },
    },
    {
      header: 'Trạng thái',
      cell: (item: WorkOrderRow) => {
        const status = item.status as string;
        if (status === 'completed')
          return <Badge variant="success">Hoàn thành</Badge>;
        if (status === 'in_progress')
          return <Badge variant="info">Đang chạy</Badge>;
        if (status === 'pending_verification')
          return <Badge variant="warning">Chờ nghiệm thu</Badge>;
        return <Badge variant="default">{status}</Badge>;
      },
    },
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          Lệnh gia công
        </h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Chờ thực hiện" value={kpis.pending} icon="clock" />
        <KpiCard label="Đang chạy" value={kpis.running} icon="play-circle" />
        <KpiCard label="Chờ nghiệm thu" value={kpis.verifying} icon="shield" />
        <KpiCard
          label="Hoàn thành"
          value={kpis.completed}
          icon="check-circle"
        />
      </div>

      <div className="bg-surface rounded-lg border border-default p-4">
        <FilterChips
          options={STATUS_FILTERS.map((f) => ({ id: f.value, label: f.label }))}
          activeValue={filter}
          onChange={setFilter}
          className="mb-4"
        />

        {isLoading ? (
          <TableSkeleton columns={4} rows={5} />
        ) : isError ? (
          <div className="p-8 text-center text-danger">
            Đã xảy ra lỗi khi tải danh sách.
          </div>
        ) : (
          <DataTable<WorkOrderRow>
            data={filteredData}
            columns={columns}
            rowKey={(item) => item.id}
            onRowClick={(row) =>
              navigate(`/portal/supplier/work-orders/${row.id}`)
            }
            emptyStateTitle="Không có lệnh gia công nào"
            emptyStateDescription="Hiện chưa có lệnh gia công nào phù hợp với bộ lọc."
            emptyStateIcon="inbox"
            renderMobileCard={(item) => (
              <div className="p-4 border-b border-default">
                <p className="font-medium">
                  WO-{(item?.id || '').split('-')[0]!.toUpperCase()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {item.target_quantity} {item.target_unit}
                </p>
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}
