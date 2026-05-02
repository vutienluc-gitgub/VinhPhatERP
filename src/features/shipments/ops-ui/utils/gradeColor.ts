import { clsx } from 'clsx';

export type OpsGrade = 'A' | 'B' | 'C' | 'RESERVED' | 'GHOST';

export function getEntityGradeStyles(grade: OpsGrade) {
  switch (grade) {
    case 'A':
      return clsx(
        'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-emerald-500/10',
      );
    case 'B':
      return clsx(
        'bg-amber-50 border-amber-200 text-amber-800 shadow-amber-500/10',
      );
    case 'C':
      return clsx(
        'bg-rose-50 border-rose-200 text-rose-800 shadow-rose-500/10',
      );
    case 'RESERVED':
      return clsx(
        'bg-slate-100 border-slate-300 text-slate-400 opacity-60 cursor-not-allowed',
      );
    case 'GHOST':
    default:
      return clsx(
        'bg-[var(--surface-subtle)] border-dashed border-slate-300 text-slate-300',
      );
  }
}
