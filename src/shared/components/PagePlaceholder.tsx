import type { ReactNode } from 'react'

type SummaryItem = {
  label: string
  value: string
}

type PagePlaceholderProps = {
  title: string
  description: string
  highlights: string[]
  resources: string[]
  summary?: SummaryItem[]
  badge?: string
  aside?: ReactNode
}

export function PagePlaceholder({
  title,
  description,
  highlights,
  resources,
  summary = [],
  badge = 'Scaffolded',
  aside,
}: PagePlaceholderProps) {
  return (
    <section className="placeholder-grid">
      <div className="placeholder-card">
        <span className="status-pill">{badge}</span>
        <h3>{title}</h3>
        <p className="placeholder-copy">{description}</p>

        {summary.length > 0 ? (
          <div className="summary-grid">
            {summary.map((item) => (
              <div className="summary-card" key={item.label}>
                <div className="summary-label">{item.label}</div>
                <div className="summary-value">{item.value}</div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="panel-card">
          <h2>Focus hien tai</h2>
          <ul className="summary-list">
            {highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="resource-card">
        <h3>Next build slices</h3>
        <ul className="resource-list">
          {resources.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        {aside}
      </div>
    </section>
  )
}