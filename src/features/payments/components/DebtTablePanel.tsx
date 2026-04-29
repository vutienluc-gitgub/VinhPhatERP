import type { ReactNode } from 'react';

import { Badge, Icon, DataTablePremium } from '@/shared/components';
import type { DataTableColumn } from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';
import {
  calculateTotalDebt,
  countDebtors,
  calculatePaymentPercentage,
  classifyDebtRisk,
} from '@/domain/payments';
import type { DebtRiskTier } from '@/domain/payments';
import { DEBT_RISK_TIER_BADGE } from '@/features/payments/payments.constants';

// ── Shared type for any debt row ────────────────────────────────────────────

export interface DebtRowBase {
  balance_due: number;
  total_paid: number;
}

// ── Config-driven DebtTablePanel ────────────────────────────────────────────

interface DebtTablePanelConfig<T extends DebtRowBase> {
  /** Data array from hook */
  data: T[];
  isLoading: boolean;
  error: unknown;

  /** KPI card labels */
  kpiTitle: string;
  kpiFooter: (count: number) => string;
  kpiIcon: string;
  countLabel: string;
  countIcon: string;
  countFooter: string;

  /** Table config */
  columns: DataTableColumn<T>[];
  rowKey: (item: T) => string;
  emptyTitle: string;
  emptyDescription: string;

  /** Mobile card renderer */
  renderMobileCard: (item: T) => ReactNode;
}

export function DebtTablePanel<T extends DebtRowBase>({
  data,
  isLoading,
  error,
  kpiTitle,
  kpiFooter,
  kpiIcon,
  countLabel,
  countIcon,
  countFooter,
  columns,
  rowKey,
  emptyTitle,
  emptyDescription,
  renderMobileCard,
}: DebtTablePanelConfig<T>) {
  const totalDebt = calculateTotalDebt(data);
  const debtorCount = countDebtors(data);

  if (error) {
    return (
      <div className="p-4">
        <p className="error-inline">
          Lỗi: {error instanceof Error ? error.message : String(error)}
        </p>
      </div>
    );
  }

  return (
    <div className="panel-card card-flush">
      {/* KPI Summary */}
      {data.length > 0 && (
        <div className="kpi-section kpi-grid">
          <div className="kpi-card-premium kpi-danger">
            <div className="kpi-overlay" />
            <div className="kpi-content">
              <div className="kpi-info">
                <p className="kpi-label">{kpiTitle}</p>
                <p className="kpi-value">
                  {formatCurrency(totalDebt)}
                  <span className="text-xs font-normal ml-1">đ</span>
                </p>
              </div>
              <div className="kpi-icon-box">
                <Icon name={kpiIcon} size={32} />
              </div>
            </div>
            <div className="kpi-footer text-xs opacity-80 italic">
              {kpiFooter(debtorCount)}
            </div>
          </div>

          <div className="kpi-card-premium kpi-warning">
            <div className="kpi-overlay" />
            <div className="kpi-content">
              <div className="kpi-info">
                <p className="kpi-label">{countLabel}</p>
                <p className="kpi-value">{debtorCount}</p>
              </div>
              <div className="kpi-icon-box">
                <Icon name={countIcon} size={32} />
              </div>
            </div>
            <div className="kpi-footer text-xs opacity-80 italic">
              {countFooter}
            </div>
          </div>
        </div>
      )}

      {/* Table & Cards */}
      <DataTablePremium
        data={data}
        isLoading={isLoading}
        rowKey={rowKey}
        emptyStateTitle={emptyTitle}
        emptyStateDescription={emptyDescription}
        emptyStateIcon="CheckCircle"
        columns={columns}
        renderMobileCard={renderMobileCard}
      />
    </div>
  );
}

// ── Shared mobile card builder ──────────────────────────────────────────────

/**
 * Renders a consistent mobile debt card with progress bar.
 * Eliminates the duplicated mobile card JSX between Customer and Supplier views.
 */
export function DebtMobileCard({
  name,
  code,
  balanceDue,
  totalAmount,
  totalPaid,
  countValue,
  countUnit,
  totalLabel,
  paidLabel,
  countLabel,
  progressLabel,
}: {
  name: string;
  code: string | null | undefined;
  balanceDue: number;
  totalAmount: number;
  totalPaid: number;
  countValue: number;
  countUnit: string;
  totalLabel: string;
  paidLabel: string;
  countLabel: string;
  progressLabel: string;
}) {
  const paidPercent = calculatePaymentPercentage(totalAmount, totalPaid);

  return (
    <div className="mobile-card">
      <div className="mobile-card-header">
        <div className="flex flex-col">
          <span className="mobile-card-title">{name}</span>
          {code && <span className="text-xs text-muted">{code}</span>}
        </div>
        <span className="font-bold text-danger text-lg">
          -{formatCurrency(balanceDue)}đ
        </span>
      </div>
      <div className="mobile-card-body space-y-3">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex flex-col">
            <span className="text-xs text-muted">{totalLabel}</span>
            <span className="font-medium">{formatCurrency(totalAmount)}đ</span>
          </div>
          <div className="flex flex-col text-center">
            <span className="text-xs text-muted">{paidLabel}</span>
            <span className="font-medium text-success">
              {formatCurrency(totalPaid)}đ
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-xs text-muted">{countLabel}</span>
            <span className="font-medium">
              {countValue} {countUnit}
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-muted mb-1">
            <span>{progressLabel}</span>
            <span>{paidPercent}%</span>
          </div>
          <div className="w-full bg-border rounded-full h-1.5">
            <div
              className="bg-success rounded-full h-1.5 transition-all"
              style={{ width: `${paidPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tiered risk badge ───────────────────────────────────────────────────────

/**
 * Renders a tiered debt risk badge based on classifyDebtRisk().
 *
 * Tiers:
 * - none:    (hidden)
 * - normal:  neutral "Còn nợ" badge
 * - warning: yellow "Cảnh báo" badge (overdue < 30d or near credit limit)
 * - danger:  red "Nợ rủi ro" badge (overdue >= 30d or over credit limit)
 */
export function DebtRiskBadge({
  balanceDue,
  oldestOverdueDays,
  creditLimit,
}: {
  balanceDue: number;
  oldestOverdueDays?: number;
  creditLimit?: number;
}) {
  const tier: DebtRiskTier = classifyDebtRisk({
    balance_due: balanceDue,
    oldest_overdue_days: oldestOverdueDays,
    credit_limit: creditLimit,
  });

  const config = DEBT_RISK_TIER_BADGE[tier];
  if (!config) return null;

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
