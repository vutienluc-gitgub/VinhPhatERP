type KpiCardProps = {
  label: string
  value: string
  color?: string
  /** Optional icon character or emoji */
  icon?: string
  /** Link destination — renders as clickable if provided */
  href?: string
}

/** 
 * Standardized KPI Card using project CSS system (.stat-card)
 * This replaces raw Tailwind with consistent design system tokens.
 */
export function KpiCard({ label, value, color, icon }: KpiCardProps) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        {icon && <span className="stat-icon" aria-hidden="true" style={{ fontSize: '1rem' }}>{icon}</span>}
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value" style={color ? { color } : undefined}>
        {value}
      </div>
    </div>
  )
}

type KpiGridProps = {
  children: React.ReactNode
}

/** 
 * Responsive grid wrapper for KpiCard items using .stats-bar
 */
export function KpiGrid({ children }: KpiGridProps) {
  return (
    <div className="stats-bar" style={{ padding: '0.75rem 0', background: 'transparent', border: 'none' }}>
      {children}
    </div>
  )
}
