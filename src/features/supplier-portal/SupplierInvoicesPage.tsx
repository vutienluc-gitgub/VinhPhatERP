import { useState } from 'react';
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
  SearchInput,
} from '@/shared/components';
import { MoneyText } from '@/shared/value';
import { SUPPLIER_PORTAL_LABELS } from '@/features/supplier-portal/supplier-portal.constants';

const TEXT = SUPPLIER_PORTAL_LABELS;

export function SupplierInvoicesPage() {
  const { profile } = useAuth();
  const supplierId = profile?.supplier_id;
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredInvoices = invoices?.filter(
    (inv: { document_number: string; document_type: string }) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        inv.document_number?.toLowerCase().includes(term) ||
        inv.document_type?.toLowerCase().includes(term)
      );
    },
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {TEXT.INVOICES_TITLE}
          </h1>
          <p className="text-muted mt-1">{TEXT.INVOICES_DESC}</p>
        </div>
        <div className="w-full sm:w-72">
          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã chứng từ..."
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{TEXT.INVOICES_CARD_TITLE}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-default overflow-hidden">
            <table className="w-full text-sm text-left text-foreground">
              <thead className="text-xs text-muted bg-surface uppercase border-b border-default">
                <tr>
                  <th className="px-6 py-3 font-medium">
                    {TEXT.INVOICES_COL_CODE}
                  </th>
                  <th className="px-6 py-3 font-medium">
                    {TEXT.INVOICES_COL_TYPE}
                  </th>
                  <th className="px-6 py-3 font-medium">
                    {TEXT.INVOICES_COL_DATE}
                  </th>
                  <th className="px-6 py-3 font-medium text-right">
                    {TEXT.INVOICES_COL_TOTAL}
                  </th>
                  <th className="px-6 py-3 font-medium text-right">
                    {TEXT.INVOICES_COL_REMAINING}
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted">
                      {TEXT.LOADING}
                    </td>
                  </tr>
                ) : filteredInvoices?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted">
                      {TEXT.INVOICES_EMPTY}
                    </td>
                  </tr>
                ) : (
                  filteredInvoices?.map(
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
