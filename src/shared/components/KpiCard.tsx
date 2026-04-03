type KpiCardProps = {
  label: string
  value: string
  color?: string
  /** Optional icon character or emoji */
  icon?: string
  /** Link destination — renders as clickable if provided */
  href?: string
}

export function KpiCard({ label, value, color, icon }: KpiCardProps) {
  return (
    <div className="kpi-card">
      {icon && <span className="kpi-card-icon" aria-hidden="true">{icon}</span>}
      <div className="kpi-card-label">{label}</div>
      <div className="kpi-card-value" style={color ? { color } : undefined}>
        {value}
      </div>
    </div>
  )
}

type KpiGridProps = {
  children: React.ReactNode
}

/** Responsive grid wrapper for KpiCard items */
export function KpiGrid({ children }: KpiGridProps) {
  return <div className="kpi-grid">{children}</div>
}
