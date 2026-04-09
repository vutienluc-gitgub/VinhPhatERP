import { useState } from 'react';

import { Icon } from '@/shared/components/Icon';
import type { ReportsFilter } from '@/api/reports.api';

type ReportsFilterBarProps = {
  filter: ReportsFilter;
  onChange: (filter: ReportsFilter) => void;
};

function defaultDateFrom(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function defaultDateTo(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ReportsFilterBar({ filter, onChange }: ReportsFilterBarProps) {
  const [dateFrom, setDateFrom] = useState(
    filter.dateFrom ?? defaultDateFrom(),
  );
  const [dateTo, setDateTo] = useState(filter.dateTo ?? defaultDateTo());

  function handleApply(e: React.FormEvent) {
    e.preventDefault();
    onChange({
      ...filter,
      dateFrom,
      dateTo,
    });
  }

  function handleClear() {
    const from = defaultDateFrom();
    const to = defaultDateTo();
    setDateFrom(from);
    setDateTo(to);
    onChange({
      dateFrom: from,
      dateTo: to,
    });
  }

  const hasCustomFilter =
    filter.dateFrom !== defaultDateFrom() || filter.dateTo !== defaultDateTo();

  return (
    <form
      className="filter-bar card-filter-section p-4 border-b border-border"
      onSubmit={handleApply}
    >
      <div className="filter-compact-premium">
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

        <div className="flex gap-2 self-end mb-[4px]">
          <button
            className="btn-primary min-h-[42px] px-6 flex items-center gap-2"
            type="submit"
          >
            <Icon name="Filter" size={16} /> Áp dụng
          </button>

          {hasCustomFilter && (
            <button
              className="btn-secondary text-danger border-danger/20 flex items-center gap-2 h-[42px]"
              type="button"
              onClick={handleClear}
            >
              <Icon name="X" size={14} /> Đặt lại
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
