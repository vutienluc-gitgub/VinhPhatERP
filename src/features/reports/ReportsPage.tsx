import { useState } from 'react'

import type { ReportsFilter } from '@/api/reports.api'
import { DebtSection } from './DebtSection'
import { InventorySection } from './InventorySection'
import { OverdueSection } from './OverdueSection'
import { ReportsFilterBar } from './ReportsFilter'
import { RevenueSection } from './RevenueSection'
import {
  useRevenueSummary,
  useDebtByCustomer,
  useInventorySummary,
  useOverdueOrders,
} from './useReports'

function defaultDateFrom(): string {
  const d = new Date()
  d.setDate(1)
  return d.toISOString().slice(0, 10)
}

function defaultDateTo(): string {
  return new Date().toISOString().slice(0, 10)
}

export function ReportsPage() {
  const [filter, setFilter] = useState<ReportsFilter>({
    dateFrom: defaultDateFrom(),
    dateTo: defaultDateTo(),
  })

  const revenue = useRevenueSummary(filter)
  const debt = useDebtByCustomer(filter)
  const inventory = useInventorySummary()
  const overdue = useOverdueOrders()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="panel-card card-flush">
        <div className="card-header-area">
          <div className="page-header">
            <div>
              <p className="eyebrow">Phân tích</p>
              <h3>Báo cáo</h3>
            </div>
          </div>
        </div>
        <ReportsFilterBar filter={filter} onChange={setFilter} />
      </div>

      <RevenueSection data={revenue.data ?? []} isLoading={revenue.isLoading} />
      <DebtSection data={debt.data ?? []} isLoading={debt.isLoading} />
      <InventorySection data={inventory.data} isLoading={inventory.isLoading} />
      <OverdueSection data={overdue.data ?? []} isLoading={overdue.isLoading} />
    </div>
  )
}