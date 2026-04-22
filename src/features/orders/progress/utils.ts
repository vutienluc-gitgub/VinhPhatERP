import type { OrderProgressWithOrder } from './types';

export function calculateOrderProgress(
  stages: OrderProgressWithOrder[],
): number {
  const activeStages = stages.filter((s) => s.status !== 'skipped');
  const totalCount = activeStages.length;
  if (totalCount === 0) return 0;

  const progressPoints = activeStages.reduce((sum, s) => {
    if (s.status === 'done') return sum + 1;
    if (s.status === 'in_progress') return sum + 0.5;
    return sum;
  }, 0);

  return Math.round((progressPoints / totalCount) * 100);
}
