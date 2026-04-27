import { useState } from 'react';

import { formatCurrency } from '@/shared/utils/format';
import { useAccountList } from '@/application/payments';
import {
  useCashFlowSummary,
  useExpenseByCategory,
} from '@/application/payments';
import { sumBy } from '@/shared/utils/array.util';

import { EXPENSE_CATEGORY_LABELS } from './payments.module';

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

      {isLoading ? (
        <p className="table-empty">Đang tải...</p>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4">
            <div className="p-3 rounded-xl bg-surface border border-border shadow-sm">
              <div className="td-muted text-[0.7rem] font-bold uppercase tracking-wider mb-1">
                Tổng thu
              </div>
              <div className="text-[1rem] sm:text-[1.15rem] font-black text-emerald-600 tabular-nums">
                {formatCurrency(totalInflow)}
                <span className="text-[10px] ml-1">đ</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-border shadow-sm">
              <div className="td-muted text-[0.7rem] font-bold uppercase tracking-wider mb-1">
                Tổng chi
              </div>
              <div className="text-[1rem] sm:text-[1.15rem] font-black text-rose-600 tabular-nums">
                {formatCurrency(totalOutflow)}
                <span className="text-[10px] ml-1">đ</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-border shadow-sm">
              <div className="td-muted text-[0.7rem] font-bold uppercase tracking-wider mb-1">
                Chênh lệch
              </div>
              <div
                className={`text-[1rem] sm:text-[1.15rem] font-black tabular-nums ${netFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
              >
                {netFlow >= 0 ? '+' : ''}
                {formatCurrency(netFlow)}
                <span className="text-[10px] ml-1">đ</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-border shadow-sm">
              <div className="td-muted text-[0.7rem] font-bold uppercase tracking-wider mb-1">
                Số dư tài khoản
              </div>
              <div
                className={`text-[1rem] sm:text-[1.15rem] font-black tabular-nums ${totalAccountBalance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}
              >
                {formatCurrency(totalAccountBalance)}
                <span className="text-[10px] ml-1">đ</span>
              </div>
            </div>
          </div>

          {/* Expense breakdown by category */}
          {expenseBreakdown.length > 0 && (
            <div className="px-4 pb-4">
              <h4 className="text-[0.92rem] mb-2">Chi phí theo danh mục</h4>
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Danh mục</th>
                      <th className="text-right">Số phiếu</th>
                      <th className="text-right">Tổng tiền</th>
                      <th className="text-right">Tỉ trọng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseBreakdown.map((row) => (
                      <tr key={row.category}>
                        <td>{EXPENSE_CATEGORY_LABELS[row.category]}</td>
                        <td className="numeric-cell">{row.expense_count}</td>
                        <td className="numeric-debt">
                          {formatCurrency(row.total_amount)} đ
                        </td>
                        <td className="numeric-cell">
                          {totalOutflow > 0
                            ? `${((row.total_amount / totalOutflow) * 100).toFixed(1)}%`
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Daily cash flow table */}
          {cashFlow.length > 0 && (
            <div className="px-4 pb-4">
              <h4 className="text-[0.92rem] mb-2">Chi tiết theo ngày</h4>
              <div className="data-table-wrap max-h-[400px] overflow-y-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ngày</th>
                      <th className="text-right">Thu vào</th>
                      <th className="text-right">Chi ra</th>
                      <th className="text-right">Chênh lệch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashFlow
                      .filter((r) => r.total_inflow > 0 || r.total_outflow > 0)
                      .map((row) => (
                        <tr key={row.period}>
                          <td className="td-muted">{row.period}</td>
                          <td className="numeric-paid">
                            {row.total_inflow > 0
                              ? `${formatCurrency(row.total_inflow)} đ`
                              : '—'}
                          </td>
                          <td className="numeric-debt">
                            {row.total_outflow > 0
                              ? `${formatCurrency(row.total_outflow)} đ`
                              : '—'}
                          </td>
                          <td
                            className={`text-right tabular-nums ${row.net_flow >= 0 ? 'text-[#27ae60]' : 'text-[#c0392b]'}`}
                          >
                            {row.net_flow >= 0 ? '+' : ''}
                            {formatCurrency(row.net_flow)} đ
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {cashFlow.length === 0 && expenseBreakdown.length === 0 && (
            <p className="table-empty">
              Chưa có giao dịch nào trong khoảng thời gian này.
            </p>
          )}
        </>
      )}
    </div>
  );
}
