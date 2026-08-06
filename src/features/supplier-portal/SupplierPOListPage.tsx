import { useState } from 'react';
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
import { SUPPLIER_PORTAL_LABELS } from '@/features/supplier-portal/supplier-portal.constants';

const TEXT = SUPPLIER_PORTAL_LABELS;

type FilterStatus = 'ALL' | 'SENT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export function SupplierPOListPage() {
  const { profile } = useAuth();
  const supplierId = profile?.supplier_id;
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('ALL');

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

  const filteredOrders = orders?.filter((po) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'SENT')
      return po.status === 'submitted' || po.status === 'pending_approval';
    if (activeFilter === 'CONFIRMED') return po.status === 'supplier_confirmed';
    if (activeFilter === 'COMPLETED') return po.status === 'completed';
    if (activeFilter === 'CANCELLED')
      return ['cancelled', 'rejected', 'request_changes'].includes(
        po.status ?? '',
      );
    return true;
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'draft':
        return <Badge variant="gray">{TEXT.PO_LIST_STATUS_DRAFT}</Badge>;
      case 'pending_approval':
      case 'submitted':
        return <Badge variant="warning">{TEXT.PO_LIST_STATUS_PENDING}</Badge>;
      case 'completed':
        return <Badge variant="success">{TEXT.PO_LIST_STATUS_APPROVED}</Badge>;
      case 'sent':
        return <Badge variant="info">{TEXT.PO_LIST_STATUS_SENT}</Badge>;
      case 'supplier_confirmed':
        return <Badge variant="success">{TEXT.PO_LIST_STATUS_CONFIRMED}</Badge>;
      case 'cancelled':
      case 'request_changes':
        return <Badge variant="danger">{TEXT.PO_LIST_STATUS_REJECTED}</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const filterOptions: Array<{ id: FilterStatus; label: string }> = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'SENT', label: 'Chờ xác nhận' },
    { id: 'CONFIRMED', label: 'Đã xác nhận' },
    { id: 'COMPLETED', label: 'Đã hoàn thành' },
    { id: 'CANCELLED', label: 'Đã hủy/Từ chối' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {TEXT.PO_LIST_TITLE}
          </h1>
          <p className="text-muted mt-1">{TEXT.PO_LIST_DESC}</p>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {filterOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setActiveFilter(opt.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors white-space-nowrap ${
              activeFilter === opt.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-surface-secondary text-muted hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{TEXT.PO_LIST_CARD_TITLE}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton columns={5} />
          ) : filteredOrders?.length === 0 ? (
            <EmptyState description={TEXT.PO_LIST_EMPTY} />
          ) : (
            <div className="rounded-md border border-default overflow-hidden">
              <table className="w-full text-sm text-left text-foreground">
                <thead className="text-xs text-muted bg-surface uppercase border-b border-default">
                  <tr>
                    <th className="px-6 py-3 font-medium">
                      {TEXT.PO_LIST_COL_CODE}
                    </th>
                    <th className="px-6 py-3 font-medium">
                      {TEXT.PO_LIST_COL_DATE}
                    </th>
                    <th className="px-6 py-3 font-medium">
                      {TEXT.PO_LIST_COL_EXPECTED}
                    </th>
                    <th className="px-6 py-3 font-medium text-right">
                      {TEXT.PO_LIST_COL_TOTAL}
                    </th>
                    <th className="px-6 py-3 font-medium">
                      {TEXT.PO_LIST_COL_STATUS}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders?.map((po, idx) => {
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
