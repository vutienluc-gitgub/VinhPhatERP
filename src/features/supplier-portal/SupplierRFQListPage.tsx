import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import { untypedDb } from '@/services/supabase/client';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  TableSkeleton,
  EmptyState,
  FilterChips,
} from '@/shared/components';
import { TableRowInteraction, evaluateInteraction } from '@/shared/interaction';
import { SUPPLIER_PORTAL_LABELS } from '@/features/supplier-portal/supplier-portal.constants';
import type { SourcingRfq } from '@/api/rfqs.api';

const TEXT = SUPPLIER_PORTAL_LABELS;

type FilterStatus = 'ALL' | 'OPEN' | 'CLOSED';

export function SupplierRFQListPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('ALL');

  const { data: rfqs, isLoading } = useQuery({
    queryKey: ['supplier-rfqs'],
    queryFn: async () => {
      const { data, error } = await untypedDb
        .from('sourcing_rfqs')
        .select('*')
        .in('status', ['published', 'closed'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredRfqs = rfqs?.filter((rfq: SourcingRfq) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'OPEN') return rfq.status === 'published';
    if (activeFilter === 'CLOSED') return rfq.status === 'closed';
    return true;
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'published':
        return <Badge variant="info">{TEXT.RFQ_LIST_STATUS_OPEN}</Badge>;
      case 'closed':
        return <Badge variant="gray">{TEXT.RFQ_LIST_STATUS_CLOSED}</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const filterOptions: Array<{ id: FilterStatus; label: string }> = [
    { id: 'ALL', label: TEXT.FILTER_ALL },
    { id: 'OPEN', label: TEXT.RFQ_LIST_STATUS_OPEN },
    { id: 'CLOSED', label: TEXT.RFQ_LIST_STATUS_CLOSED },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {TEXT.RFQ_LIST_TITLE}
          </h1>
          <p className="text-muted mt-1">{TEXT.RFQ_LIST_DESC}</p>
        </div>
      </div>

      <FilterChips
        options={filterOptions}
        activeValue={activeFilter}
        onChange={(val) => setActiveFilter(val as FilterStatus)}
      />

      <Card>
        <CardHeader>
          <CardTitle>{TEXT.RFQ_LIST_CARD_TITLE}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton columns={4} />
          ) : filteredRfqs?.length === 0 ? (
            <EmptyState description={TEXT.RFQ_LIST_EMPTY} />
          ) : (
            <div className="rounded-md border border-default overflow-hidden">
              <table className="w-full text-sm text-left text-foreground">
                <thead className="text-xs text-muted bg-surface uppercase border-b border-default">
                  <tr>
                    <th className="px-6 py-3 font-medium">
                      {TEXT.RFQ_LIST_COL_CODE}
                    </th>
                    <th className="px-6 py-3 font-medium">
                      {TEXT.RFQ_LIST_COL_TITLE}
                    </th>
                    <th className="px-6 py-3 font-medium">
                      {TEXT.RFQ_LIST_COL_DEADLINE}
                    </th>
                    <th className="px-6 py-3 font-medium">
                      {TEXT.RFQ_LIST_COL_STATUS}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRfqs?.map((rfq: SourcingRfq) => {
                    const { intent, attention } = evaluateInteraction(
                      'purchase',
                      rfq,
                    );

                    return (
                      <TableRowInteraction
                        key={rfq.id}
                        interactionDomain="purchase"
                        intent={intent}
                        attention={attention}
                        onClick={() =>
                          navigate(`/portal/supplier/quotations/${rfq.id}`)
                        }
                      >
                        <td className="px-6 py-4 font-medium relative">
                          {rfq.rfq_code}
                        </td>
                        <td className="px-6 py-4">{rfq.title}</td>
                        <td className="px-6 py-4 text-destructive">
                          {rfq.deadline_date
                            ? dayjs(rfq.deadline_date).format(
                                'DD/MM/YYYY HH:mm',
                              )
                            : '-'}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(rfq.status)}
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
