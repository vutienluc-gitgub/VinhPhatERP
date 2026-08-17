/**
 * Pure utility functions for Customer Portal.
 * Re-exported from domain/portal for backward compatibility.
 */
export {
  applyCustomerFilter,
  sortByDateDesc,
  computeDebtSummary,
  computeStageOverdue,
  paginateList,
  type DebtSummary,
  type StageOverdueInput,
} from '@/domain/portal/portal.utils';
