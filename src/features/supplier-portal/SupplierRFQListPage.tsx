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
} from '@/shared/components';
import { TableRowInteraction, evaluateInteraction } from '@/shared/interaction';
import type { SourcingRfq } from '@/api/rfqs.api';

const TEXT = {
  TITLE: 'Yêu cầu báo giá (RFQ)',
  DESC: 'Danh sách các yêu cầu báo giá từ Vĩnh Phát ERP',
  CARD_TITLE: 'Danh sách yêu cầu báo giá',
  COL_CODE: 'Mã RFQ',
  COL_TITLE: 'Tiêu đề',
  COL_DEADLINE: 'Hạn chót',
  COL_STATUS: 'Trạng thái',
  EMPTY: 'Chưa có yêu cầu báo giá nào',
  STATUS_OPEN: 'Đang mở',
  STATUS_CLOSED: 'Đã đóng',
};

export function SupplierRFQListPage() {
  const navigate = useNavigate();

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

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'published':
        return <Badge variant="info">{TEXT.STATUS_OPEN}</Badge>;
      case 'closed':
        return <Badge variant="gray">{TEXT.STATUS_CLOSED}</Badge>;
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
            <TableSkeleton columns={4} />
          ) : rfqs?.length === 0 ? (
            <EmptyState description={TEXT.EMPTY} />
          ) : (
            <div className="rounded-md border border-default overflow-hidden">
              <table className="w-full text-sm text-left text-foreground">
                <thead className="text-xs text-muted bg-surface uppercase border-b border-default">
                  <tr>
                    <th className="px-6 py-3 font-medium">{TEXT.COL_CODE}</th>
                    <th className="px-6 py-3 font-medium">{TEXT.COL_TITLE}</th>
                    <th className="px-6 py-3 font-medium">
                      {TEXT.COL_DEADLINE}
                    </th>
                    <th className="px-6 py-3 font-medium">{TEXT.COL_STATUS}</th>
                  </tr>
                </thead>
                <tbody>
                  {rfqs?.map((rfq: SourcingRfq) => {
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
