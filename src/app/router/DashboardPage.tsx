import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/services/supabase/client'

type DashboardStats = {
  draftOrders: number
  activeOrders: number
  overdueOrders: number
  totalDebt: number
  recentPayments: number
  pendingShipments: number
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const today = new Date().toISOString().slice(0, 10)

      const [drafts, active, overdue, debt, payments, shipments] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
        supabase.from('orders').select('id', { count: 'exact', head: true }).in('status', ['confirmed', 'in_progress']),
        supabase.from('orders').select('id', { count: 'exact', head: true }).in('status', ['confirmed', 'in_progress']).lt('delivery_date', today),
        supabase.from('orders').select('total_amount, paid_amount').in('status', ['confirmed', 'in_progress', 'completed']),
        supabase.from('payments').select('amount').gte('payment_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)),
        supabase.from('shipments').select('id', { count: 'exact', head: true }).eq('status', 'preparing'),
      ])

      const totalDebt = (debt.data ?? []).reduce((sum, o) => sum + (o.total_amount - o.paid_amount), 0)
      const recentPayments = (payments.data ?? []).reduce((sum, p) => sum + p.amount, 0)

      return {
        draftOrders: drafts.count ?? 0,
        activeOrders: active.count ?? 0,
        overdueOrders: overdue.count ?? 0,
        totalDebt: Math.max(0, totalDebt),
        recentPayments,
        pendingShipments: shipments.count ?? 0,
      }
    },
    refetchInterval: 60_000,
  })
}

export function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats()

  const cards = [
    { label: 'Đơn nháp', value: stats?.draftOrders ?? '—', color: '#6b7280' },
    { label: 'Đang xử lý', value: stats?.activeOrders ?? '—', color: '#0b6bcb' },
    { label: 'Trễ hạn', value: stats?.overdueOrders ?? '—', color: stats?.overdueOrders ? '#c0392b' : '#0c8f68' },
    { label: 'Tổng công nợ', value: stats ? `${formatCurrency(stats.totalDebt)} đ` : '—', color: stats && stats.totalDebt > 0 ? '#c0392b' : '#0c8f68' },
    { label: 'Thu 7 ngày qua', value: stats ? `${formatCurrency(stats.recentPayments)} đ` : '—', color: '#0c8f68' },
    { label: 'Chờ giao', value: stats?.pendingShipments ?? '—', color: '#d97706' },
  ]

  return (
    <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '1.25rem' }}>
        <div className="page-header">
          <div>
            <p className="eyebrow">Tổng quan</p>
            <h3>Dashboard</h3>
          </div>
        </div>

        {isLoading ? (
          <p className="table-empty">Đang tải...</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '0.75rem',
            marginTop: '1rem',
          }}>
            {cards.map((card) => (
              <div
                key={card.label}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  background: 'var(--bg)',
                }}
              >
                <div className="td-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
                  {card.label}
                </div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  color: card.color,
                }}>
                  {card.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}