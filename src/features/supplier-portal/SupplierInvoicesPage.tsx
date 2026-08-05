import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { untypedDb } from '@/services/supabase/client';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components';
import { MoneyText } from '@/shared/value';

export function SupplierInvoicesPage() {
  const { profile } = useAuth();
  const supplierId = profile?.supplier_id;

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['supplier-invoices', supplierId],
    queryFn: async () => {
      if (!supplierId) return [];
      const { data, error } = await untypedDb
        .from('v_unpaid_documents')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('document_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!supplierId,
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Hóa đơn chờ thanh toán
          </h1>
          <p className="text-muted mt-1">
            Danh sách các hóa đơn hoặc chứng từ chưa được thanh toán đủ.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chứng từ nợ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-default overflow-hidden">
            <table className="w-full text-sm text-left text-foreground">
              <thead className="text-xs text-muted bg-surface uppercase border-b border-default">
                <tr>
                  <th className="px-6 py-3 font-medium">Mã Chứng Từ</th>
                  <th className="px-6 py-3 font-medium">Loại</th>
                  <th className="px-6 py-3 font-medium">Ngày Ghi Nhận</th>
                  <th className="px-6 py-3 font-medium text-right">
                    Tổng Tiền
                  </th>
                  <th className="px-6 py-3 font-medium text-right">
                    Còn Lại (Nợ)
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : invoices?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted">
                      Không có hóa đơn nợ nào
                    </td>
                  </tr>
                ) : (
                  invoices?.map(
                    (inv: {
                      document_id: string;
                      document_number: string;
                      document_type: string;
                      document_date: string;
                      total_amount: number;
                      remaining_amount: number;
                    }) => (
                      <tr
                        key={inv.document_id}
                        className="border-b border-default hover:bg-surface-secondary"
                      >
                        <td className="px-6 py-4 font-medium">
                          {inv.document_number}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="gray">{inv.document_type}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          {inv.document_date
                            ? dayjs(inv.document_date).format('DD/MM/YYYY')
                            : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <MoneyText value={inv.total_amount ?? 0} />
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-danger">
                          <MoneyText value={inv.remaining_amount ?? 0} />
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
