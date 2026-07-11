import { useState, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import { MoneyCell, MoneyText } from '@/shared/value';
import { KpiCard, KpiGrid, DataTableAdvanced } from '@/shared/components';
import { useAccountList } from '@/application/payments';
import {
  useCashFlowSummary,
  useExpenseByCategory,
} from '@/application/payments';
import { sumBy } from '@/shared/utils/array.util';

import { EXPENSE_CATEGORY_LABELS } from './payments.module';
import type { CashFlowRow, ExpenseByCategoryRow } from './types';

function getDefaultDates(): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  return {
    from,
    to,
  };
}

export function CashFlowDashboard() {
  const defaults = getDefaultDates();
  const [fromDate, setFromDate] = useState(defaults.from);
  const [toDate, setToDate] = useState(defaults.to);

  const { data: cashFlow = [], isLoading: loadingCashFlow } =
    useCashFlowSummary(fromDate, toDate);
  const { data: expenseBreakdown = [], isLoading: loadingExpenses } =
    useExpenseByCategory(fromDate, toDate);
  const { data: accounts = [] } = useAccountList();

  // Aggregated totals
  const totalInflow = sumBy(cashFlow, (r) => r.total_inflow);
  const totalOutflow = sumBy(cashFlow, (r) => r.total_outflow);
  const netFlow = totalInflow - totalOutflow;
  const totalAccountBalance = sumBy(accounts, (a) => a.current_balance);

  const isLoading = loadingCashFlow || loadingExpenses;

  // Filter out zero-activity days before passing to the table
  const activeCashFlow = useMemo(
    () => cashFlow.filter((r) => r.total_inflow > 0 || r.total_outflow > 0),
    [cashFlow],
  );

  // -- Column definitions: Chi tiết theo ngày
  const cashFlowColumns = useMemo<ColumnDef<CashFlowRow>[]>(
    () => [
      {
        accessorKey: 'period',
        header: 'Ngày',
        meta: { className: 'text-muted text-sm' },
        cell: ({ getValue }) => getValue<string>(),
      },
      {
        accessorKey: 'total_inflow',
        header: 'Thu vào',
        meta: { className: 'text-right' },
        cell: ({ getValue }) => {
          const v = getValue<number>();
          return v > 0 ? (
            <MoneyCell value={v} tone="success" bold />
          ) : (
            <span className="text-muted text-sm">—</span>
          );
        },
      },
      {
        accessorKey: 'total_outflow',
        header: 'Chi ra',
        meta: { className: 'text-right' },
        cell: ({ getValue }) => {
          const v = getValue<number>();
          return v > 0 ? (
            <MoneyCell value={v} tone="danger" bold />
          ) : (
            <span className="text-muted text-sm">—</span>
          );
        },
      },
      {
        accessorKey: 'net_flow',
        header: 'Chênh lệch',
        meta: { className: 'text-right' },
        cell: ({ getValue }) => {
          const v = getValue<number>();
          return (
            <span
              className={`tabular-nums font-semibold ${v >= 0 ? 'text-[var(--success-strong)]' : 'text-[var(--danger-strong)]'}`}
            >
              {v >= 0 ? '+' : ''}
              <MoneyText value={v} />
            </span>
          );
        },
      },
      {
        accessorKey: 'inflow_count',
        header: 'Số phiếu thu',
        meta: { className: 'text-right' },
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'outflow_count',
        header: 'Số phiếu chi',
        meta: { className: 'text-right' },
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue<number>()}</span>
        ),
      },
    ],
    [],
  );

  // -- Column definitions: Chi phí theo danh mục
  const expenseColumns = useMemo<ColumnDef<ExpenseByCategoryRow>[]>(
    () => [
      {
        accessorKey: 'category',
        header: 'Danh mục',
        cell: ({ getValue }) =>
          EXPENSE_CATEGORY_LABELS[getValue<ExpenseByCategoryRow['category']>()],
      },
      {
        accessorKey: 'expense_count',
        header: 'Số phiếu',
        meta: { className: 'text-right' },
        cell: ({ getValue }) => (
          <span className="text-right tabular-nums">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'total_amount',
        header: 'Tổng tiền',
        meta: { className: 'text-right' },
        cell: ({ getValue }) => (
          <MoneyCell value={getValue<number>()} tone="danger" bold />
        ),
      },
      {
        id: 'share',
        header: 'Tỉ trọng',
        meta: { className: 'text-right' },
        cell: ({ row }) =>
          totalOutflow > 0
            ? `${((row.original.total_amount / totalOutflow) * 100).toFixed(1)}%`
            : '—',
      },
    ],
    [totalOutflow],
  );

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <span className="font-bold text-lg">Dòng tiền</span>
      </div>

      {/* Date range filter */}
      <div className="filter-bar card-filter-section">
        <div className="filter-field">
          <label htmlFor="cf-from">Từ ngày</label>
          <input
            id="cf-from"
            className="field-input"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="filter-field">
          <label htmlFor="cf-to">Đến ngày</label>
          <input
            id="cf-to"
            className="field-input"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </div>

      {/* Content wrapper */}
      <>
        {/* KPI Summary */}
        <div className="p-4">
          <KpiGrid>
            <KpiCard
              label="Tổng thu"
              value={totalInflow}
              formatMode="currency"
              icon="TrendingUp"
              variant="success"
              isLoading={isLoading}
            />
            <KpiCard
              label="Tổng chi"
              value={totalOutflow}
              formatMode="currency"
              icon="TrendingDown"
              variant="danger"
              isLoading={isLoading}
            />
            <KpiCard
              label="Chênh lệch"
              value={Math.abs(netFlow)}
              formatMode="currency"
              icon="Activity"
              variant={netFlow >= 0 ? 'success' : 'danger'}
              trendValue={netFlow >= 0 ? 'Dương' : 'Âm'}
              trendDirection={netFlow >= 0 ? 'up' : 'down'}
              isLoading={isLoading}
            />
            <KpiCard
              label="Số dư tài khoản"
              value={totalAccountBalance}
              formatMode="currency"
              icon="Wallet"
              variant={totalAccountBalance >= 0 ? 'primary' : 'danger'}
              isLoading={isLoading}
            />
          </KpiGrid>
        </div>

        {/* Chi phí theo danh mục */}
        <div className="px-4 pb-4">
          <h4 className="text-[0.92rem] font-semibold mb-3">
            Chi phí theo danh mục
          </h4>
          <DataTableAdvanced
            data={expenseBreakdown}
            columns={expenseColumns}
            isLoading={isLoading}
            skeletonRows={5}
            rowKey={(r) => r.category}
            exportFileName={`chi-phi-danh-muc_${fromDate}_${toDate}`}
            emptyStateTitle="Không có chi phí"
            emptyStateDescription="Chưa có phiếu chi nào trong khoảng thời gian này."
            emptyStateIcon="ReceiptText"
            renderMobileCard={(row) => (
              <div className="flex items-center justify-between py-1">
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">
                    {EXPENSE_CATEGORY_LABELS[row.category]}
                  </span>
                  <span className="text-xs text-muted">
                    {row.expense_count} phiếu
                  </span>
                </div>
                <span className="numeric-debt text-sm font-bold">
                  <MoneyText value={row.total_amount} />
                </span>
              </div>
            )}
          />
        </div>

        {/* Chi tiết theo ngày */}
        <div className="px-4 pb-6">
          <h4 className="text-[0.92rem] font-semibold mb-3">
            Chi tiết theo ngày
          </h4>
          <DataTableAdvanced
            data={activeCashFlow}
            columns={cashFlowColumns}
            isLoading={isLoading}
            skeletonRows={8}
            rowKey={(r) => r.period}
            exportFileName={`dong-tien_${fromDate}_${toDate}`}
            emptyStateTitle="Không có giao dịch"
            emptyStateDescription="Chưa có giao dịch nào trong khoảng thời gian này."
            emptyStateIcon="LineChart"
            renderMobileCard={(row) => (
              <div className="flex items-center justify-between py-1">
                <span className="text-muted text-sm text-sm">{row.period}</span>
                <div className="flex flex-col items-end gap-0.5">
                  {row.total_inflow > 0 && (
                    <span className="numeric-paid text-xs">
                      +<MoneyText value={row.total_inflow} />
                    </span>
                  )}
                  {row.total_outflow > 0 && (
                    <span className="numeric-debt text-xs">
                      -<MoneyText value={row.total_outflow} />
                    </span>
                  )}
                  <span
                    className={`text-xs font-bold tabular-nums ${row.net_flow >= 0 ? 'text-[var(--success-strong)]' : 'text-[var(--danger-strong)]'}`}
                  >
                    {row.net_flow >= 0 ? '+' : ''}
                    <MoneyText value={row.net_flow} />
                  </span>
                </div>
              </div>
            )}
          />
        </div>
      </>
    </div>
  );
}
