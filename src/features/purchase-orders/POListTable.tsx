import type { ColumnDef } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import dayjs from 'dayjs';

import { Badge, DataTableAdvanced, Button } from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';
import type { PurchaseOrder } from '@/domain/purchase-orders';

export function POListTable({
  data,
  isLoading,
}: {
  data: PurchaseOrder[];
  isLoading: boolean;
}) {
  const navigate = useNavigate();

  const columns = useMemo<ColumnDef<PurchaseOrder>[]>(
    () => [
      {
        accessorKey: 'po_code',
        header: 'Mã PO',
        cell: ({ row }) => (
          <span className="font-medium text-primary">
            {row.original.po_code}
          </span>
        ),
      },
      {
        accessorKey: 'order_date',
        header: 'Ngày đặt',
        cell: ({ row }) => dayjs(row.original.order_date).format('DD/MM/YYYY'),
      },
      {
        accessorKey: 'supplier_name_snapshot',
        header: 'Nhà cung cấp',
      },
      {
        accessorKey: 'total_amount',
        header: 'Tổng tiền',
        cell: ({ row }) => formatCurrency(row.original.total_amount) + ' đ',
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: ({ row }) => {
          const s = row.original.status;
          if (s === 'draft') return <Badge variant="gray">Nháp</Badge>;
          if (s === 'approved') return <Badge variant="info">Đã duyệt</Badge>;
          if (s === 'partial_received')
            return <Badge variant="warning">Nhập 1 phần</Badge>;
          if (s === 'completed')
            return <Badge variant="success">Hoàn tất</Badge>;
          if (s === 'rejected') return <Badge variant="danger">Từ chối</Badge>;
          if (s === 'cancelled') return <Badge variant="danger">Đã huỷ</Badge>;
          return <Badge variant="gray">{s}</Badge>;
        },
      },
      {
        accessorKey: 'progress_percentage',
        header: 'Tiến độ',
        cell: ({ row }) => {
          const p = row.original.progress_percentage ?? 0;
          return (
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-gray-200 rounded overflow-hidden">
                <div
                  className={`h-full ${p >= 100 ? 'bg-green-500' : p > 0 ? 'bg-orange-400' : 'bg-gray-300'}`}
                  style={{ width: `${Math.min(100, Math.max(0, p))}%` }}
                />
              </div>
              <span className="text-xs">{p}%</span>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h2 className="text-lg font-semibold m-0">Danh sách Đơn Đặt Hàng</h2>
        <Button
          variant="primary"
          onClick={() => navigate('/purchase-orders/create')}
        >
          + Tạo PO mới
        </Button>
      </div>
      <DataTableAdvanced
        data={data}
        columns={columns}
        isLoading={isLoading}
        onRowClick={(row) => navigate(`/purchase-orders/${row.id}`)}
      />
    </div>
  );
}
