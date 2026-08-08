import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { AdaptiveSheet, TabSwitcher, DataTable } from '@/shared/components';
import { WeightText } from '@/shared/value';
import type { YarnAvailability } from '@/api/yarn-reservation.api';
import {
  fetchYarnReceiptHistory,
  fetchYarnAdjustmentHistory,
} from '@/api/yarn-stock-ledger.api';

interface YarnStockLedgerModalProps {
  yarn: YarnAvailability | null;
  isOpen: boolean;
  onClose: () => void;
}

export function YarnStockLedgerModal({
  yarn,
  isOpen,
  onClose,
}: YarnStockLedgerModalProps) {
  const [activeTab, setActiveTab] = useState<'receipts' | 'adjustments'>(
    'receipts',
  );

  const { data: receipts, isLoading: loadingReceipts } = useQuery({
    queryKey: ['yarn-receipt-history', yarn?.id],
    queryFn: () => fetchYarnReceiptHistory(yarn!.id),
    enabled: isOpen && !!yarn?.id && activeTab === 'receipts',
  });

  const { data: adjustments, isLoading: loadingAdjustments } = useQuery({
    queryKey: ['yarn-adjustment-history', yarn?.id],
    queryFn: () => fetchYarnAdjustmentHistory(yarn!.id),
    enabled: isOpen && !!yarn?.id && activeTab === 'adjustments',
  });

  if (!yarn) return null;

  return (
    <AdaptiveSheet
      open={isOpen}
      onClose={onClose}
      title={`Thẻ kho: ${yarn.code} - ${yarn.name}`}
      size="xl"
    >
      <div className="p-4 flex flex-col gap-4">
        <TabSwitcher
          tabs={[
            { key: 'receipts', label: 'Lịch sử nhập kho (Receipts)' },
            { key: 'adjustments', label: 'Lịch sử điều chỉnh (Adjustments)' },
          ]}
          active={activeTab}
          onChange={(v) => setActiveTab(v as 'receipts' | 'adjustments')}
        />

        {activeTab === 'receipts' && (
          <DataTable
            data={receipts || []}
            isLoading={loadingReceipts}
            rowKey={(r) => r.id}
            columns={[
              {
                header: 'Ngày nhập',
                cell: (row) =>
                  new Date(row.receipt_date).toLocaleDateString('vi-VN'),
              },
              {
                header: 'Mã Phiếu',
                cell: (row) => row.receipt_number,
              },
              {
                header: 'Nhà cung cấp',
                cell: (row) => row.supplier_name || '—',
              },
              {
                header: 'Số lượng',
                cell: (row) => (
                  <WeightText value={row.quantity} suffix={row.unit} />
                ),
                className: 'text-right',
              },
              {
                header: 'Ghi chú',
                cell: (row) => (
                  <span className="text-muted-foreground text-sm">
                    {row.notes || '—'}
                  </span>
                ),
              },
            ]}
            emptyStateTitle="Chưa có lịch sử nhập kho"
            emptyStateDescription="Mã sợi này chưa được nhập kho lần nào."
            renderMobileCard={(row) => (
              <div className="mobile-card flex flex-col gap-1 p-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-foreground">
                    {row.receipt_number}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(row.receipt_date).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="text-sm">{row.supplier_name || '—'}</div>
                <div className="flex justify-between mt-1 items-end">
                  <span className="text-xs text-muted-foreground italic">
                    {row.notes || ''}
                  </span>
                  <span className="font-bold">
                    <WeightText value={row.quantity} suffix={row.unit} />
                  </span>
                </div>
              </div>
            )}
          />
        )}

        {activeTab === 'adjustments' && (
          <DataTable
            data={adjustments || []}
            isLoading={loadingAdjustments}
            rowKey={(r) => r.id}
            columns={[
              {
                header: 'Ngày tạo',
                cell: (row) => {
                  const d = new Date(row.created_at);
                  return `${d.toLocaleDateString('vi-VN')} ${d.toTimeString().slice(0, 5)}`;
                },
              },
              {
                header: 'Loại',
                cell: (row) => row.adjustment_type,
              },
              {
                header: 'Số lượng',
                cell: (row) => (
                  <WeightText
                    value={row.adjustment_qty}
                    className={
                      row.adjustment_qty > 0 ? 'text-success' : 'text-danger'
                    }
                  />
                ),
                className: 'text-right',
              },
              {
                header: 'Lý do',
                cell: (row) => row.reason,
              },
              {
                header: 'Ghi chú',
                cell: (row) => (
                  <span className="text-muted-foreground text-sm">
                    {row.notes || '—'}
                  </span>
                ),
              },
            ]}
            emptyStateTitle="Chưa có lịch sử điều chỉnh"
            emptyStateDescription="Mã sợi này chưa phát sinh giao dịch xuất hoặc điều chỉnh nào."
            renderMobileCard={(row) => (
              <div className="mobile-card flex flex-col gap-1 p-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-foreground">
                    {row.adjustment_type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(row.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="text-sm">{row.reason}</div>
                <div className="flex justify-between mt-1 items-end">
                  <span className="text-xs text-muted-foreground italic">
                    {row.notes || ''}
                  </span>
                  <span className="font-bold">
                    <WeightText
                      value={row.adjustment_qty}
                      className={
                        row.adjustment_qty > 0 ? 'text-success' : 'text-danger'
                      }
                    />
                  </span>
                </div>
              </div>
            )}
          />
        )}
      </div>
    </AdaptiveSheet>
  );
}
