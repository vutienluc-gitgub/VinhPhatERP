export type AgingSeverity = 'critical' | 'warning' | 'caution';

export const AGING_THRESHOLDS = {
  CRITICAL: 90,
  WARNING: 60,
};

export const AGING_CONFIG: Record<
  AgingSeverity,
  { label: string; variant: 'danger' | 'warning' | 'gray' }
> = {
  critical: {
    label: 'Nghiêm trọng',
    variant: 'danger',
  },
  warning: {
    label: 'Cảnh báo',
    variant: 'warning',
  },
  caution: {
    label: 'Lưu ý',
    variant: 'gray',
  },
};

export function getAgingSeverity(days: number): AgingSeverity {
  if (days >= AGING_THRESHOLDS.CRITICAL) return 'critical';
  if (days >= AGING_THRESHOLDS.WARNING) return 'warning';
  return 'caution';
}

export function calculateAgingStats(rolls: Array<{ age_days?: number }>) {
  const criticalCount = rolls.filter(
    (r) => (r.age_days ?? 0) >= AGING_THRESHOLDS.CRITICAL,
  ).length;
  const warningCount = rolls.filter(
    (r) =>
      (r.age_days ?? 0) >= AGING_THRESHOLDS.WARNING &&
      (r.age_days ?? 0) < AGING_THRESHOLDS.CRITICAL,
  ).length;
  return { criticalCount, warningCount };
}
