import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { useAuth } from '@/features/auth/AuthProvider';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  StatCard,
  EmptyState,
  FilterChips,
} from '@/shared/components';
import { MoneyText } from '@/shared/value';
import { fetchSupplierDebtTransactions } from '@/api/supplier-debt.api';
import { untypedDb } from '@/services/supabase/client';
import { SUPPLIER_PORTAL_LABELS } from '@/features/supplier-portal/supplier-portal.constants';

const TEXT = SUPPLIER_PORTAL_LABELS;

type FilterTxType = 'ALL' | 'PURCHASE' | 'PAYMENT' | 'ADJUSTMENT';

export function SupplierDebtPage() {
  const { profile } = useAuth();
  const supplierId = profile?.supplier_id;
  const [activeFilter, setActiveFilter] = useState<FilterTxType>('ALL');

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

  const filteredTransactions = transactions?.filter((tx) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'PURCHASE') return tx.type === 'purchase';
    if (activeFilter === 'PAYMENT') return tx.type === 'payment';
    if (activeFilter === 'ADJUSTMENT') return tx.type === 'adjustment';
    return true;
  });

  const getTxTypeBadge = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Badge variant="warning">{TEXT.DEBT_TYPE_PURCHASE}</Badge>;
      case 'payment':
        return <Badge variant="success">{TEXT.DEBT_TYPE_PAYMENT}</Badge>;
      case 'adjustment':
        return <Badge variant="gray">{TEXT.DEBT_TYPE_ADJUSTMENT}</Badge>;
      default:
        return <Badge variant="default">{type}</Badge>;
    }
  };

  const filterOptions: Array<{ id: FilterTxType; label: string }> = [
    { id: 'ALL', label: TEXT.FILTER_ALL },
    { id: 'PURCHASE', label: TEXT.DEBT_TYPE_PURCHASE },
    { id: 'PAYMENT', label: TEXT.DEBT_TYPE_PAYMENT },
    { id: 'ADJUSTMENT', label: TEXT.DEBT_TYPE_ADJUSTMENT },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {TEXT.DEBT_TITLE}
          </h1>
          <p className="text-muted-foreground mt-1">{TEXT.DEBT_DESC}</p>
        </div>
      </div>

      {/* ── Stat Cards (StatCard Component) ── */}
      <div className="portal-summary-grid">
        <StatCard
          label={TEXT.DEBT_TOTAL_ACCRUED}
          value={<MoneyText value={debt?.total_purchased ?? 0} />}
          icon="TrendingUp"
          tone="default"
          isLoading={isLoadingDebt}
        />
        <StatCard
          label={TEXT.DEBT_TOTAL_PAID}
          value={<MoneyText value={debt?.total_paid ?? 0} />}
          icon="CheckCircle"
          tone="success"
          isLoading={isLoadingDebt}
        />
        <StatCard
          label={TEXT.DEBT_BALANCE}
          value={<MoneyText value={debt?.balance_due ?? 0} />}
          icon="Receipt"
          tone="danger"
          isLoading={isLoadingDebt}
        />
      </div>

      <FilterChips
        options={filterOptions}
        activeValue={activeFilter}
        onChange={setActiveFilter}
      />

      <Card>
        <CardHeader>
          <CardTitle>{TEXT.DEBT_HISTORY_TITLE}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-default overflow-hidden">
            <table className="w-full text-sm text-left text-foreground">
              <thead className="text-xs text-muted-foreground bg-surface uppercase border-b border-default">
                <tr>
                  <th className="px-6 py-3 font-medium">
                    {TEXT.DEBT_COL_TIME}
                  </th>
                  <th className="px-6 py-3 font-medium">
                    {TEXT.DEBT_COL_TYPE}
                  </th>
                  <th className="px-6 py-3 font-medium">
                    {TEXT.DEBT_COL_REFERENCE}
                  </th>
                  <th className="px-6 py-3 font-medium text-right">
                    {TEXT.DEBT_COL_DEBIT}
                  </th>
                  <th className="px-6 py-3 font-medium text-right">
                    {TEXT.DEBT_COL_CREDIT}
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoadingTx || isLoadingDebt ? (
                  <tr>
                    <td colSpan={5} className="p-8">
                      <div className="space-y-4">
                        <div className="skeleton-block h-10 w-full" />
                        <div className="skeleton-block h-10 w-full" />
                        <div className="skeleton-block h-10 w-full" />
                      </div>
                    </td>
                  </tr>
                ) : filteredTransactions?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8">
                      <EmptyState icon="Inbox" description={TEXT.DEBT_EMPTY} />
                    </td>
                  </tr>
                ) : (
                  filteredTransactions?.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-default hover:bg-surface-secondary"
                    >
                      <td className="px-6 py-4">
                        {dayjs(tx.created_at).format('DD/MM/YYYY HH:mm')}
                      </td>
                      <td className="px-6 py-4">{getTxTypeBadge(tx.type)}</td>
                      <td className="px-6 py-4 font-medium text-muted-foreground">
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
