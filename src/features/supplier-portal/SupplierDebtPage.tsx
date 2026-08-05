import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { useAuth } from '@/features/auth/AuthProvider';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components';
import { MoneyText } from '@/shared/value';
import { fetchSupplierDebtTransactions } from '@/api/supplier-debt.api';
import { untypedDb } from '@/services/supabase/client';

export function SupplierDebtPage() {
  const { profile } = useAuth();
  const supplierId = profile?.supplier_id;

  const { data: debt, isLoading: isLoadingDebt } = useQuery({
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

  const { data: transactions, isLoading: isLoadingTx } = useQuery({
    queryKey: ['supplier-debt-tx', supplierId],
    queryFn: () =>
      supplierId ? fetchSupplierDebtTransactions(supplierId) : [],
    enabled: !!supplierId,
  });

  const getTxTypeBadge = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Badge variant="warning">Mua hàng (Nợ tăng)</Badge>;
      case 'payment':
        return <Badge variant="success">Thanh toán (Nợ giảm)</Badge>;
      case 'adjustment':
        return <Badge variant="gray">Điều chỉnh</Badge>;
      default:
        return <Badge variant="default">{type}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Công nợ</h1>
          <p className="text-muted mt-1">
            Quản lý số dư công nợ và lịch sử giao dịch.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl border border-default p-4 shadow-sm">
          <div className="text-sm font-medium text-muted">
            Tổng phát sinh nợ
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">
            <MoneyText value={debt?.total_purchased ?? 0} />
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-default p-4 shadow-sm">
          <div className="text-sm font-medium text-muted">
            Tổng đã thanh toán
          </div>
          <div className="text-2xl font-bold text-success mt-2">
            <MoneyText value={debt?.total_paid ?? 0} />
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-default p-4 shadow-sm col-span-1 md:col-span-2">
          <div className="text-sm font-medium text-muted">
            Công nợ hiện tại (Chờ thanh toán)
          </div>
          <div className="text-2xl font-bold text-danger mt-2">
            <MoneyText value={debt?.balance_due ?? 0} />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử giao dịch</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-default overflow-hidden">
            <table className="w-full text-sm text-left text-foreground">
              <thead className="text-xs text-muted bg-surface uppercase border-b border-default">
                <tr>
                  <th className="px-6 py-3 font-medium">Thời Gian</th>
                  <th className="px-6 py-3 font-medium">Loại GD</th>
                  <th className="px-6 py-3 font-medium">Tham Chiếu</th>
                  <th className="px-6 py-3 font-medium text-right">
                    Nợ Phát Sinh
                  </th>
                  <th className="px-6 py-3 font-medium text-right">
                    Đã Thanh Toán
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoadingTx || isLoadingDebt ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : transactions?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted">
                      Chưa có giao dịch công nợ nào
                    </td>
                  </tr>
                ) : (
                  transactions?.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-default hover:bg-surface-secondary"
                    >
                      <td className="px-6 py-4">
                        {dayjs(tx.created_at).format('DD/MM/YYYY HH:mm')}
                      </td>
                      <td className="px-6 py-4">{getTxTypeBadge(tx.type)}</td>
                      <td className="px-6 py-4 font-medium text-muted">
                        {tx.reference_type} / {tx.reference_id?.split('-')[0]}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {tx.type !== 'payment' && tx.amount > 0 ? (
                          <span className="text-warning font-medium">
                            +<MoneyText value={tx.amount} />
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {tx.type === 'payment' ? (
                          <span className="text-success font-medium">
                            <MoneyText value={tx.amount} />
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
