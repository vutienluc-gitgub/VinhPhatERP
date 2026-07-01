import { MoneyCell } from '@/shared/value';
import { useSupplierDebt } from '@/application/payments';
import { Button } from '@/shared/components';

import { DEBT_LABELS } from './payments.constants';
import {
  DebtTablePanel,
  DebtMobileCard,
  DebtRiskBadge,
} from './components/DebtTablePanel';
import type { SupplierDebtRow } from './types';

const L = DEBT_LABELS.supplier;

export function SupplierDebtSummary({
  onPay,
}: {
  onPay?: (supplierId: string) => void;
}) {
  const { data: debts = [], isLoading, error } = useSupplierDebt();

  return (
    <DebtTablePanel<SupplierDebtRow>
      data={debts}
      isLoading={isLoading}
      error={error}
      kpiTitle={L.kpiTitle}
      kpiFooter={L.kpiFooter}
      kpiIcon={L.kpiIcon}
      countLabel={L.countLabel}
      countIcon={L.countIcon}
      countFooter={L.countFooter}
      emptyTitle={L.emptyTitle}
      emptyDescription={L.emptyDescription}
      rowKey={(d) => d.supplier_id}
      columns={[
        {
          header: 'Nhà cung cấp',
          id: 'supplier_name',
          sortable: true,
          accessor: (d) => d.supplier_name,
          cell: (d) => (
            <div className="flex flex-col">
              <span className="font-bold">{d.supplier_name}</span>
              {d.supplier_code && (
                <span className="text-xs text-muted">{d.supplier_code}</span>
              )}
              <DebtRiskBadge balanceDue={d.balance_due} />
            </div>
          ),
        },
        {
          header: 'Số phiếu',
          id: 'document_count',
          sortable: true,
          className: 'text-right',
          cell: (d) => <span className="font-medium">{d.document_count}</span>,
        },
        {
          header: L.totalLabel,
          id: 'total_purchased',
          sortable: true,
          className: 'text-right',
          cell: (d) => <MoneyCell value={d.total_purchased} bold />,
        },
        {
          header: L.paidLabel,
          id: 'total_paid',
          sortable: true,
          className: 'text-right',
          cell: (d) => <MoneyCell value={d.total_paid} bold tone="success" />,
        },
        {
          header: 'Còn nợ',
          id: 'balance_due',
          sortable: true,
          className: 'text-right',
          cell: (d) => <MoneyCell value={d.balance_due} bold tone="danger" />,
        },
        {
          header: '',
          id: 'actions',
          sortable: false,
          className: 'text-right',
          cell: (d) => (
            <div className="flex justify-end gap-2">
              <Button
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onPay?.(d.supplier_id);
                }}
                disabled={d.balance_due <= 0}
              >
                Thanh toán
              </Button>
            </div>
          ),
        },
      ]}
      renderMobileCard={(d) => (
        <DebtMobileCard
          name={d.supplier_name}
          code={d.supplier_code}
          balanceDue={d.balance_due}
          totalAmount={d.total_purchased}
          totalPaid={d.total_paid}
          countValue={d.document_count}
          countUnit={L.docUnit}
          totalLabel={L.totalLabel}
          paidLabel={L.paidLabel}
          countLabel="Số phiếu"
          progressLabel={L.progressLabel}
          onPay={() => onPay?.(d.supplier_id)}
        />
      )}
    />
  );
}
