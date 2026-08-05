import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { useAuth } from '@/features/auth/AuthProvider';
import { untypedDb } from '@/services/supabase/client';
import { MoneyText } from '@/shared/value';
import { Badge } from '@/shared/components';

export function SupplierDashboardPage() {
  const { profile } = useAuth();
  const supplierId = profile?.supplier_id;

  // Metric 1: Unpaid Debt
  const { data: debt } = useQuery({
    queryKey: ['supplier-debt', supplierId],
    queryFn: async () => {
      if (!supplierId) return null;
      const { data } = await untypedDb
        .from('v_supplier_debt')
        .select('*')
        .eq('supplier_id', supplierId)
        .maybeSingle();
      return data as {
        balance_due: number;
        total_purchased: number;
        total_paid: number;
      } | null;
    },
    enabled: !!supplierId,
  });

  // Metric 2: New POs (pending, sent, approved)
  const { data: newPoCount } = useQuery({
    queryKey: ['supplier-new-pos', supplierId],
    queryFn: async () => {
      if (!supplierId) return 0;
      const { count } = await untypedDb
        .from('purchase_orders')
        .select('*', { count: 'exact', head: true })
        .eq('supplier_id', supplierId)
        .in('status', ['pending', 'approved', 'sent']);
      return count || 0;
    },
    enabled: !!supplierId,
  });

  // Metric 3: Delivering POs
  const { data: deliveringPoCount } = useQuery({
    queryKey: ['supplier-delivering-pos', supplierId],
    queryFn: async () => {
      if (!supplierId) return 0;
      const { count } = await untypedDb
        .from('purchase_orders')
        .select('*', { count: 'exact', head: true })
        .eq('supplier_id', supplierId)
        .eq('status', 'confirmed');
      return count || 0;
    },
    enabled: !!supplierId,
  });

  // Metric 4: New RFQs
  const { data: newRfqCount } = useQuery({
    queryKey: ['supplier-new-rfqs'],
    queryFn: async () => {
      const { count } = await untypedDb
        .from('sourcing_rfqs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');
      return count || 0;
    },
    enabled: !!supplierId,
  });

  // Lists: Recent POs
  const { data: recentPos } = useQuery({
    queryKey: ['supplier-recent-pos', supplierId],
    queryFn: async () => {
      if (!supplierId) return [];
      const { data } = await untypedDb
        .from('purchase_orders')
        .select('id, po_code, status, order_date, total_amount')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!supplierId,
  });

  // Lists: Recent RFQs
  const { data: recentRfqs } = useQuery({
    queryKey: ['supplier-recent-rfqs'],
    queryFn: async () => {
      const { data } = await untypedDb
        .from('sourcing_rfqs')
        .select('id, rfq_code, title, status, deadline_date')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!supplierId,
  });

  const getPoStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
      case 'sent':
        return <Badge variant="warning">Mới</Badge>;
      case 'approved':
      case 'confirmed':
        return <Badge variant="info">Đang xử lý</Badge>;
      case 'completed':
        return <Badge variant="success">Hoàn thành</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Xin chào, {profile?.full_name}
        </h1>
        <p className="text-muted mt-1">
          Đây là tổng quan hoạt động cung cấp của bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl border border-default p-4 shadow-sm">
          <div className="text-sm font-medium text-muted">
            Đơn hàng mới (PO)
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">
            {newPoCount ?? 0}
          </div>
          <div className="text-xs text-muted mt-1">Đang chờ bạn xác nhận</div>
        </div>

        <div className="bg-surface rounded-xl border border-default p-4 shadow-sm">
          <div className="text-sm font-medium text-muted">
            Báo giá cần phản hồi (RFQ)
          </div>
          <div className="text-2xl font-bold text-warning mt-2">
            {newRfqCount ?? 0}
          </div>
          <div className="text-xs text-muted mt-1">Cần xử lý báo giá</div>
        </div>

        <div className="bg-surface rounded-xl border border-default p-4 shadow-sm">
          <div className="text-sm font-medium text-muted">Đang giao hàng</div>
          <div className="text-2xl font-bold text-info mt-2">
            {deliveringPoCount ?? 0}
          </div>
          <div className="text-xs text-muted mt-1">
            Lô hàng đang được thực hiện
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-default p-4 shadow-sm">
          <div className="text-sm font-medium text-muted">
            Hóa đơn chờ thanh toán
          </div>
          <div className="text-2xl font-bold text-danger mt-2">
            <MoneyText value={debt?.balance_due ?? 0} />
          </div>
          <div className="text-xs text-muted mt-1">Tổng công nợ hiện tại</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl border border-default p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Đơn hàng gần đây
          </h2>
          <div className="text-sm text-muted">
            <ul className="space-y-3">
              {recentPos?.length === 0 ? (
                <li className="text-muted text-center py-4">
                  Chưa có đơn hàng nào
                </li>
              ) : (
                recentPos?.map(
                  (po: {
                    id: string;
                    po_code: string;
                    order_date: string;
                    total_amount: number;
                    status: string;
                  }) => (
                    <li
                      key={po.id}
                      className="flex justify-between items-center py-2 border-b border-default last:border-0"
                    >
                      <div>
                        <div className="font-medium text-foreground">
                          {po.po_code}
                        </div>
                        <div className="text-xs mt-0.5">
                          {dayjs(po.order_date).format('DD/MM/YYYY')} -{' '}
                          <MoneyText value={po.total_amount ?? 0} />
                        </div>
                      </div>
                      {getPoStatusBadge(po.status)}
                    </li>
                  ),
                )
              )}
            </ul>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-default p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Yêu cầu báo giá mới (RFQ)
          </h2>
          <div className="text-sm text-muted">
            <ul className="space-y-3">
              {recentRfqs?.length === 0 ? (
                <li className="text-muted text-center py-4">Chưa có RFQ nào</li>
              ) : (
                recentRfqs?.map(
                  (rfq: { id: string; rfq_code: string; title: string }) => (
                    <li
                      key={rfq.id}
                      className="flex justify-between items-center py-2 border-b border-default last:border-0"
                    >
                      <div>
                        <div className="font-medium text-foreground">
                          {rfq.rfq_code}
                        </div>
                        <div className="text-xs mt-0.5 truncate max-w-[200px]">
                          {rfq.title}
                        </div>
                      </div>
                      <Badge variant="info">Mới</Badge>
                    </li>
                  ),
                )
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
