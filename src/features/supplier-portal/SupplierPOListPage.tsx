import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { supabase } from '@/services/supabase/client';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  TableSkeleton,
  EmptyState,
} from '@/shared/components';
import { TableRowInteraction, evaluateInteraction } from '@/shared/interaction';
import { MoneyText } from '@/shared/value';

const TEXT = {
  TITLE: 'Đơn đặt hàng (PO)',
  DESC: 'Quản lý các đơn đặt hàng từ Vĩnh Phát ERP',
  CARD_TITLE: 'Danh sách đơn hàng',
  COL_CODE: 'Mã Đơn',
  COL_DATE: 'Ngày Đặt',
  COL_EXPECTED: 'Ngày Giao Dự Kiến',
  COL_TOTAL: 'Tổng Tiền',
  COL_STATUS: 'Trạng Thái',
  EMPTY: 'Chưa có đơn đặt hàng nào',
  STATUS_DRAFT: 'Bản nháp',
  STATUS_PENDING: 'Chờ duyệt',
  STATUS_APPROVED: 'Đã duyệt',
  STATUS_SENT: 'Đã gửi',
  STATUS_CONFIRMED: 'Đã xác nhận',
  STATUS_REJECTED: 'Đã từ chối',
};

export function SupplierPOListPage() {
  const { profile } = useAuth();
  const supplierId = profile?.supplier_id;

  const { data: orders, isLoading } = useQuery({
    queryKey: ['supplier-pos', supplierId],
    queryFn: async () => {
      if (!supplierId) return [];
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!supplierId,
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'draft':
        return <Badge variant="gray">{TEXT.STATUS_DRAFT}</Badge>;
      case 'pending_approval':
      case 'submitted':
        return <Badge variant="warning">{TEXT.STATUS_PENDING}</Badge>;
      case 'completed':
        return <Badge variant="success">{TEXT.STATUS_APPROVED}</Badge>;
      case 'sent':
        return <Badge variant="info">{TEXT.STATUS_SENT}</Badge>;
      case 'supplier_confirmed':
        return <Badge variant="success">{TEXT.STATUS_CONFIRMED}</Badge>;
      case 'cancelled':
      case 'request_changes':
        return <Badge variant="danger">{TEXT.STATUS_REJECTED}</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{TEXT.TITLE}</h1>
          <p className="text-muted mt-1">{TEXT.DESC}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{TEXT.CARD_TITLE}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton columns={5} />
          ) : orders?.length === 0 ? (
            <EmptyState description={TEXT.EMPTY} />
          ) : (
            <div className="rounded-md border border-default overflow-hidden">
              <table className="w-full text-sm text-left text-foreground">
                <thead className="text-xs text-muted bg-surface uppercase border-b border-default">
                  <tr>
                    <th className="px-6 py-3 font-medium">{TEXT.COL_CODE}</th>
                    <th className="px-6 py-3 font-medium">{TEXT.COL_DATE}</th>
                    <th className="px-6 py-3 font-medium">
                      {TEXT.COL_EXPECTED}
                    </th>
                    <th className="px-6 py-3 font-medium text-right">
                      {TEXT.COL_TOTAL}
                    </th>
                    <th className="px-6 py-3 font-medium">{TEXT.COL_STATUS}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders?.map((po, idx) => {
                    const { intent, attention } = evaluateInteraction(
                      'purchase',
                      po,
                    );

                    return (
                      <TableRowInteraction
                        key={po.id}
                        interactionDomain="purchase"
                        intent={intent}
                        attention={idx === 0 ? 'highlightOnce' : attention}
                      >
                        <td className="px-6 py-4 font-medium relative">
                          {po.po_code}
                        </td>
                        <td className="px-6 py-4">
                          {dayjs(po.order_date).format('DD/MM/YYYY')}
                        </td>
                        <td className="px-6 py-4">
                          {po.expected_date
                            ? dayjs(po.expected_date).format('DD/MM/YYYY')
                            : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <MoneyText value={po.total_amount ?? 0} />
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(po.status)}
                        </td>
                      </TableRowInteraction>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
