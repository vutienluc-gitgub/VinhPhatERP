import { useState } from 'react'

import type { ReportsFilter } from '@/api/reports.api'

type ReportsFilterBarProps = {
  filter: ReportsFilter
  onChange: (filter: ReportsFilter) => void
}

function defaultDateFrom(): string {
  const d = new Date()
  d.setDate(1)
  return d.toISOString().slice(0, 10)
}

function defaultDateTo(): string {
  return new Date().toISOString().slice(0, 10)
}

export function ReportsFilterBar({ filter, onChange }: ReportsFilterBarProps) {
  const [dateFrom, setDateFrom] = useState(filter.dateFrom ?? defaultDateFrom())
  const [dateTo, setDateTo] = useState(filter.dateTo ?? defaultDateTo())

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    onChange({ ...filter, dateFrom, dateTo })
  }

  function handleClear() {
    const from = defaultDateFrom()
    const to = defaultDateTo()
    setDateFrom(from)
    setDateTo(to)
    onChange({ dateFrom: from, dateTo: to })
  }

  const hasCustomFilter = filter.dateFrom !== defaultDateFrom() || filter.dateTo !== defaultDateTo()

  return (
    <form className="filter-bar card-filter-section" onSubmit={handleApply}>
      <div className="filter-field">
        <label htmlFor="rpt-date-from">Từ ngày</label>
        <input
          id="rpt-date-from"
          className="field-input"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
      </div>

      <div className="filter-field">
        <label htmlFor="rpt-date-to">Đến ngày</label>
        <input
          id="rpt-date-to"
          className="field-input"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
      </div>

      <button
        className="primary-button btn-standard"
        type="submit"
        style={{ alignSelf: 'flex-end' }}
      >
        Áp dụng
      </button>

      {hasCustomFilter && (
        <button
          className="btn-secondary"
          type="button"
          onClick={handleClear}
          style={{ alignSelf: 'flex-end' }}
        >
          ✕ Đặt lại
        </button>
      )}
    </form>
  )
}
