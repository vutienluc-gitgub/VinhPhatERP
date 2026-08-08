import { clsx } from 'clsx';

export type OpsGrade = 'A' | 'B' | 'C' | 'RESERVED' | 'GHOST';

export function getEntityGradeStyles(grade: OpsGrade) {
  switch (grade) {
    case 'A':
      return clsx(
        'bg-emerald-50 border-success text-success shadow-emerald-500/10',
      );
    case 'B':
      return clsx(
        'bg-amber-50 border-warning text-warning-strong shadow-amber-500/10',
      );
    case 'C':
      return clsx('bg-rose-50 border-danger text-danger shadow-rose-500/10');
    case 'RESERVED':
      return clsx(
        'bg-surface-secondary border-muted text-muted-foreground opacity-60 cursor-not-allowed',
      );
    case 'GHOST':
    default:
      return clsx(
        'bg-[var(--surface-subtle)] border-dashed border-muted text-muted-foreground',
      );
  }
}
