import { useState } from 'react';

import { Button, ClearFilterButton } from '@/shared/components';
import type { ReportsFilter } from '@/api/reports.api';

import { REPORT_LABELS } from './reports.constants';

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
          <label htmlFor="rpt-date-from">
            {REPORT_LABELS.FILTER_FROM_DATE}
          </label>
          <input
            id="rpt-date-from"
            className="field-input"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div className="filter-field">
          <label htmlFor="rpt-date-to">{REPORT_LABELS.FILTER_TO_DATE}</label>
          <input
            id="rpt-date-to"
            className="field-input"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        <div className="flex gap-2 self-end mb-[4px] w-full sm:w-auto mt-2 sm:mt-0">
          <Button
            variant="primary"
            leftIcon="Filter"
            className="min-h-[42px] px-6 flex items-center gap-2 flex-1 sm:flex-none justify-center"
            type="submit"
          >
            {REPORT_LABELS.FILTER_APPLY}
          </Button>

          {hasCustomFilter && (
            <ClearFilterButton
              onClick={handleClear}
              label={REPORT_LABELS.FILTER_RESET}
            />
          )}
        </div>
      </div>
    </form>
  );
}
