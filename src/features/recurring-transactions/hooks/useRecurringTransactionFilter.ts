import { useMemo } from 'react';

import type { RecurringTransaction } from '@/domain/recurring-transactions/types';
import {
  getRecurringStatus,
  getRelativeDays,
} from '@/domain/recurring-transactions';

export function useRecurringTransactionFilter(
  transactions: RecurringTransaction[],
  filters: Record<string, string | undefined>,
  debouncedSearch: string | undefined,
) {
  return useMemo(() => {
    let result = [...transactions];

    if (debouncedSearch) {
      const lower = debouncedSearch.toLowerCase();
      result = result.filter(
        (tx) =>
          tx.name.toLowerCase().includes(lower) ||
          tx.description?.toLowerCase().includes(lower),
      );
    }
    if (filters.category) {
      result = result.filter((tx) => tx.category === filters.category);
    }
    if (filters.frequency) {
      result = result.filter((tx) => tx.frequency === filters.frequency);
    }
    if (filters.status) {
      result = result.filter((tx) => getRecurringStatus(tx) === filters.status);
    }
    if (filters.quick_filter && filters.quick_filter !== 'all') {
      const q = filters.quick_filter;
      if (q === 'overdue') {
        result = result.filter(
          (tx) => tx.is_active && getRelativeDays(tx.next_run_date) < 0,
        );
      } else if (q === 'today') {
        result = result.filter(
          (tx) => tx.is_active && getRelativeDays(tx.next_run_date) === 0,
        );
      } else if (q === '7days') {
        result = result.filter(
          (tx) =>
            tx.is_active &&
            getRelativeDays(tx.next_run_date) >= 0 &&
            getRelativeDays(tx.next_run_date) <= 7,
        );
      } else if (q === 'active') {
        result = result.filter((tx) => tx.is_active);
      }
    }

    // Default sort by next_run_date ascending, then by name
    result.sort((a, b) => {
      const dateA = new Date(a.next_run_date).getTime();
      const dateB = new Date(b.next_run_date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [transactions, debouncedSearch, filters]);
}
