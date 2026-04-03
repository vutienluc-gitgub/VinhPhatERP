import { useState } from 'react'

import type { ReportsFilter } from '@/api/reports.api'
import { DebtAgingSection } from './DebtAgingSection'
import { DebtSection } from './DebtSection'
import { InventorySection } from './InventorySection'
import { OverdueSection } from './OverdueSection'
import { ProductionSection } from './ProductionSection'
import { ReportsFilterBar } from './ReportsFilter'
import { RevenueSection } from './RevenueSection'
import { RevenueTrendSection } from './RevenueTrendSection'
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
} from './useReports'

function defaultDateFrom(): string {
  const d = new Date()
  d.setDate(1)
  return d.toISOString().slice(0, 10)
}

function defaultDateTo(): string {
  return new Date().toISOString().slice(0, 10)
}

type Tab = 'overview' | 'revenue' | 'debt' | 'production' | 'inventory'

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Tổng quan CEO' },
  { key: 'revenue', label: 'Doanh thu' },
  { key: 'debt', label: 'Công nợ' },
  { key: 'production', label: 'Sản xuất' },
  { key: 'inventory', label: 'Tồn kho' },
]

export function ReportsPage() {
  const [filter, setFilter] = useState<ReportsFilter>({
    dateFrom: defaultDateFrom(),
    dateTo: defaultDateTo(),
  })
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  // Basic reports
  const revenue = useRevenueSummary(filter)
  const debt = useDebtByCustomer(filter)
  const inventory = useInventorySummary()
  const overdue = useOverdueOrders()

  // Deep analytics
  const debtAging = useDebtAging()
  const production = useProductionEfficiency()
  const onTime = useOnTimeDelivery()
  const monthlyRevenue = useMonthlyRevenue()
  const fabricRevenue = useRevenueByFabric()
  const payments = usePaymentCollection()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header + filter */}
      <div className="panel-card card-flush">
        <div className="card-header-area">
          <div className="page-header">
            <div>
              <p className="eyebrow">Bảng điều khiển</p>
              <h3>Báo cáo CEO</h3>
            </div>
          </div>
        </div>
        <ReportsFilterBar filter={filter} onChange={setFilter} />

        {/* Tab bar */}
        <div style={{
          display: 'flex',
          gap: '0',
          borderTop: '1px solid var(--border)',
          overflowX: 'auto',
        }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '0.6rem 1.25rem',
                fontSize: '0.8rem',
                fontWeight: activeTab === tab.key ? 700 : 500,
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeTab === tab.key ? 'var(--fg)' : 'var(--fg-muted)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <>
          <RevenueSection data={revenue.data ?? []} isLoading={revenue.isLoading} />
          <DebtAgingSection data={debtAging.data ?? []} isLoading={debtAging.isLoading} />
          <ProductionSection
            efficiencyData={production.data ?? []}
            onTimeData={onTime.data ?? []}
            isLoading={production.isLoading || onTime.isLoading}
          />
          <OverdueSection data={overdue.data ?? []} isLoading={overdue.isLoading} />
        </>
      )}

      {activeTab === 'revenue' && (
        <>
          <RevenueSection data={revenue.data ?? []} isLoading={revenue.isLoading} />
          <RevenueTrendSection
            monthlyData={monthlyRevenue.data ?? []}
            fabricData={fabricRevenue.data ?? []}
            paymentData={payments.data ?? []}
            isLoading={monthlyRevenue.isLoading || fabricRevenue.isLoading || payments.isLoading}
          />
        </>
      )}

      {activeTab === 'debt' && (
        <>
          <DebtSection data={debt.data ?? []} isLoading={debt.isLoading} />
          <DebtAgingSection data={debtAging.data ?? []} isLoading={debtAging.isLoading} />
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
        <InventorySection data={inventory.data} isLoading={inventory.isLoading} />
      )}
    </div>
  )
}