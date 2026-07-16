import { useMemo } from 'react';

import { UNPAID_DOCS_MESSAGES as MSG } from '@/features/payments/payments.constants';
import { useUnpaidDocuments } from '@/application/payments';
import { sumBy } from '@/shared/utils/array.util';
import type { UnpaidDocument } from '@/domain/payments/types';

export type GroupedDoc = {
  isGroup: boolean;
  id: string;
  title: string;
  subtitle: string;
  date: string;
  remaining: number;
  paid_amount: number;
  items: UnpaidDocument[];
};

export function useGroupedUnpaidDocuments(supplierId: string) {
  const { data: unpaidDocs, isLoading } = useUnpaidDocuments(supplierId);

  const groupedDocs = useMemo(() => {
    if (!unpaidDocs) return [];

    const result: GroupedDoc[] = [];
    const fabricByDate: Record<string, UnpaidDocument[]> = {};

    unpaidDocs.forEach((doc) => {
      if (doc.document_type === 'fabric_purchase') {
        const dateKey = doc.document_date;
        if (!fabricByDate[dateKey]) fabricByDate[dateKey] = [];
        fabricByDate[dateKey].push(doc);
      } else {
        result.push({
          isGroup: false,
          id: doc.document_id,
          title: doc.document_number,
          subtitle:
            doc.document_type === 'weaving_invoice'
              ? MSG.DOC_WEAVING
              : MSG.DOC_YARN,
          date: doc.document_date,
          remaining: doc.remaining_amount,
          paid_amount: doc.paid_amount,
          items: [doc],
        });
      }
    });

    Object.entries(fabricByDate).forEach(([dateStr, docs]) => {
      const totalRemaining = sumBy(docs, (d) => d.remaining_amount);
      const totalPaid = sumBy(docs, (d) => d.paid_amount);

      result.push({
        isGroup: true,
        id: `fabric_group_${dateStr}`,
        title: MSG.DOC_FABRIC(docs.length),
        subtitle: MSG.DOC_FABRIC_SUB,
        date: dateStr,
        remaining: totalRemaining,
        paid_amount: totalPaid,
        items: docs,
      });
    });

    // Sort by date descending
    result.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return result;
  }, [unpaidDocs]);

  return { groupedDocs, isLoading, unpaidDocs };
}
