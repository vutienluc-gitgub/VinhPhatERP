import { useState } from 'react';

import type { ReportsFilter } from '@/api/reports.api';

import { DebtAgingSection } from './DebtAgingSection';
import { DebtSection } from './DebtSection';
import { InventorySection } from './InventorySection';
import { OverdueSection } from './OverdueSection';
import { ProductionSection } from './ProductionSection';
import styles from './reports.module.css';
import { ReportsFilterBar } from './ReportsFilter';
import { RevenueSection } from './RevenueSection';
import { RevenueTrendSection } from './RevenueTrendSection';
import {
  useRevenueSummary,
  useDebtByCustomer,
  useInventorySummary,
  useOverdueOrders,
  useDebtAging,
  useProductionEfficiency,
  useOnTimeDelivery,
  useMonthlyRevenue,
  useRevenueByFabric,
  usePaymentCollection,
} from './useReports';

function defaultDateFrom(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function defaultDateTo(): string {
  return new Date().toISOString().slice(0, 10);
}

type Tab = 'overview' | 'revenue' | 'debt' | 'production' | 'inventory';

const TABS: { key: Tab; label: string }[] = [
  {
    key: 'overview',
    label: 'Tổng quan CEO',
  },
  {
    key: 'revenue',
    label: 'Doanh thu',
  },
  {
    key: 'debt',
    label: 'Công nợ',
  },
  {
    key: 'production',
    label: 'Sản xuất',
  },
  {
    key: 'inventory',
    label: 'Tồn kho',
  },
];

export function ReportsPage() {
  const [filter, setFilter] = useState<ReportsFilter>({
    dateFrom: defaultDateFrom(),
    dateTo: defaultDateTo(),
  });
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Basic reports
  const revenue = useRevenueSummary(filter);
  const debt = useDebtByCustomer(filter);
  const inventory = useInventorySummary();
  const overdue = useOverdueOrders();

  // Deep analytics
  const debtAging = useDebtAging();
  const production = useProductionEfficiency();
  const onTime = useOnTimeDelivery();
  const monthlyRevenue = useMonthlyRevenue();
  const fabricRevenue = useRevenueByFabric();
  const payments = usePaymentCollection();

  return (
    <div className="route-content">
      {/* Header + filter */}
      <div className="panel-card card-flush">
        <div className="card-header-area">
          <div className="page-header">
            <div>
              <p className="eyebrow">Bảng điều khiển</p>
              <h3>Báo cáo CEO</h3>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--muted)',
                  marginTop: '0.25rem',
                }}
              >
                Phân tích hoạt động kinh doanh đa chiều theo thời gian cụ thể
              </p>
            </div>
          </div>
        </div>

        <ReportsFilterBar filter={filter} onChange={setFilter} />

        {/* Tab switcher using project style (bottom border on active) */}
        <div className={styles.tabBar}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`${styles.tabButton} ${activeTab === tab.key ? styles.tabButtonActive : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content wrapper with spacing */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        {activeTab === 'overview' && (
          <>
            <RevenueSection
              data={revenue.data ?? []}
              isLoading={revenue.isLoading}
            />
            <DebtAgingSection
              data={debtAging.data ?? []}
              isLoading={debtAging.isLoading}
            />
            <ProductionSection
              efficiencyData={production.data ?? []}
              onTimeData={onTime.data ?? []}
              isLoading={production.isLoading || onTime.isLoading}
            />
            <OverdueSection
              data={overdue.data ?? []}
              isLoading={overdue.isLoading}
            />
          </>
        )}

        {activeTab === 'revenue' && (
          <>
            <RevenueSection
              data={revenue.data ?? []}
              isLoading={revenue.isLoading}
            />
            <RevenueTrendSection
              monthlyData={monthlyRevenue.data ?? []}
              fabricData={fabricRevenue.data ?? []}
              paymentData={payments.data ?? []}
              isLoading={
                monthlyRevenue.isLoading ||
                fabricRevenue.isLoading ||
                payments.isLoading
              }
            />
          </>
        )}

        {activeTab === 'debt' && activeTab === 'debt' && (
          <>
            <DebtSection data={debt.data ?? []} isLoading={debt.isLoading} />
            <DebtAgingSection
              data={debtAging.data ?? []}
              isLoading={debtAging.isLoading}
            />
          </>
        )}

        {activeTab === 'production' && (
          <ProductionSection
            efficiencyData={production.data ?? []}
            onTimeData={onTime.data ?? []}
            isLoading={production.isLoading || onTime.isLoading}
          />
        )}

        {activeTab === 'inventory' && (
          <InventorySection
            data={inventory.data}
            isLoading={inventory.isLoading}
          />
        )}
      </div>
    </div>
  );
}
