import { useState } from 'react';

import { formatCurrency } from '@/shared/utils/format';
import { useAccountList } from '@/application/payments';
import {
  useCashFlowSummary,
  useExpenseByCategory,
} from '@/application/payments';

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
  const totalInflow = cashFlow.reduce((s, r) => s + r.total_inflow, 0);
  const totalOutflow = cashFlow.reduce((s, r) => s + r.total_outflow, 0);
  const netFlow = totalInflow - totalOutflow;
  const totalAccountBalance = accounts.reduce(
    (s, a) => s + a.current_balance,
    0,
  );

  const isLoading = loadingCashFlow || loadingExpenses;

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Tài chính</p>
            <h3>Dòng tiền</h3>
          </div>
        </div>
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem',
              padding: '1rem',
            }}
          >
            <div
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
            >
              <div
                className="td-muted"
                style={{
                  fontSize: '0.78rem',
                  marginBottom: '0.25rem',
                }}
              >
                Tổng thu
              </div>
              <div
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  color: '#27ae60',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatCurrency(totalInflow)} đ
              </div>
            </div>
            <div
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
            >
              <div
                className="td-muted"
                style={{
                  fontSize: '0.78rem',
                  marginBottom: '0.25rem',
                }}
              >
                Tổng chi
              </div>
              <div
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  color: '#c0392b',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatCurrency(totalOutflow)} đ
              </div>
            </div>
            <div
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
            >
              <div
                className="td-muted"
                style={{
                  fontSize: '0.78rem',
                  marginBottom: '0.25rem',
                }}
              >
                Chênh lệch
              </div>
              <div
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  color: netFlow >= 0 ? '#27ae60' : '#c0392b',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {netFlow >= 0 ? '+' : ''}
                {formatCurrency(netFlow)} đ
              </div>
            </div>
            <div
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
            >
              <div
                className="td-muted"
                style={{
                  fontSize: '0.78rem',
                  marginBottom: '0.25rem',
                }}
              >
                Số dư tài khoản
              </div>
              <div
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  color: totalAccountBalance >= 0 ? '#2980b9' : '#c0392b',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatCurrency(totalAccountBalance)} đ
              </div>
            </div>
          </div>

          {/* Expense breakdown by category */}
          {expenseBreakdown.length > 0 && (
            <div style={{ padding: '0 1rem 1rem' }}>
              <h4
                style={{
                  fontSize: '0.92rem',
                  marginBottom: '0.5rem',
                }}
              >
                Chi phí theo danh mục
              </h4>
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
            <div style={{ padding: '0 1rem 1rem' }}>
              <h4
                style={{
                  fontSize: '0.92rem',
                  marginBottom: '0.5rem',
                }}
              >
                Chi tiết theo ngày
              </h4>
              <div
                className="data-table-wrap"
                style={{
                  maxHeight: 400,
                  overflowY: 'auto',
                }}
              >
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
                            style={{
                              textAlign: 'right',
                              color: row.net_flow >= 0 ? '#27ae60' : '#c0392b',
                              fontVariantNumeric: 'tabular-nums',
                            }}
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
