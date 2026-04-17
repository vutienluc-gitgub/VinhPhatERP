type KpiCardProps = {
  label: string;
  value: string;
  color?: string;
  /** Optional icon character or emoji */
  icon?: string;
  /** Link destination — renders as clickable if provided */
  href?: string;
};

/**
 * Standardized KPI Card using project CSS system (.stat-card)
 * This replaces raw Tailwind with consistent design system tokens.
 */
export function KpiCard({ label, value, color, icon }: KpiCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-1.5">
        {icon && (
          <span className="stat-icon text-base" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value" style={color ? { color } : undefined}>
        {value}
      </div>
    </div>
  );
}

type KpiGridProps = {
  children: React.ReactNode;
};

/**
 * Responsive grid wrapper for KpiCard items using .stats-bar
 */
export function KpiGrid({ children }: KpiGridProps) {
  return (
    <div className="stats-bar py-3 bg-transparent border-none">{children}</div>
  );
}
