import type { RecurringTransaction } from './types';

export interface RecurringTransactionMetrics {
  totalCount: number;
  dueSoonCount: number; // Trong vòng 7 ngày
  overdueCount: number;
  totalEstimatedNextMonthAmount: number; // Ước lượng tổng chi phí tháng tới (30 ngày)
  totalCurrentMonthAmount: number; // Tổng chi phí cần chi tháng này (ước tính)
}

/**
 * Tính toán các chỉ số thống kê (KPI) cho danh sách nghiệp vụ định kỳ.
 * Domain logic: Không phụ thuộc UI hay React.
 */
export function calculateRecurringMetrics(
  transactions: RecurringTransaction[],
): RecurringTransactionMetrics {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(today.getDate() + 7);

  let dueSoonCount = 0;
  let overdueCount = 0;
  let totalEstimatedNextMonthAmount = 0;
  let totalCurrentMonthAmount = 0;

  for (const tx of transactions) {
    if (!tx.is_active) continue;

    const nextRun = new Date(tx.next_run_date);
    nextRun.setHours(0, 0, 0, 0);

    // Overdue
    if (nextRun < today) {
      overdueCount++;
    }

    // Due Soon (<= 7 days from today, and >= today)
    if (nextRun >= today && nextRun <= sevenDaysLater) {
      dueSoonCount++;
    }

    // Current Month Amount (Nếu nextRun nằm trong tháng hiện tại)
    if (
      nextRun.getMonth() === today.getMonth() &&
      nextRun.getFullYear() === today.getFullYear()
    ) {
      totalCurrentMonthAmount += tx.amount;
    }

    // Add overdue amounts to current month if they haven't been paid yet
    // Because they will be paid this month when the user clicks generate.
    if (nextRun < today) {
      totalCurrentMonthAmount += tx.amount;
    }

    // Next Month Estimated Amount
    // A simplified estimation: assuming each active transaction will run at least once next month.
    // If frequency is 'monthly', it's 1x amount.
    // If 'quarterly' and next month is the month, it's 1x amount.

    // To properly calculate next month's estimated amount, we can calculate the next run date
    // from today, and see if it falls in the next month. Or if it's already overdue, the
    // next run date after paying it might fall in next month.
    // For simplicity:
    if (tx.frequency === 'monthly') {
      totalEstimatedNextMonthAmount += tx.amount;
    } else if (tx.frequency === 'quarterly') {
      // rough estimation for quarterly
      totalEstimatedNextMonthAmount += tx.amount / 3;
    } else if (tx.frequency === 'yearly') {
      totalEstimatedNextMonthAmount += tx.amount / 12;
    }
  }

  return {
    totalCount: transactions.length,
    dueSoonCount,
    overdueCount,
    totalEstimatedNextMonthAmount,
    totalCurrentMonthAmount,
  };
}
