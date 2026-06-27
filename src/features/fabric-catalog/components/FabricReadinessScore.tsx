import { clsx } from 'clsx';

import { Badge, Icon } from '@/shared/components';
import { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';
import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';
import { useFabricReadinessScore } from '@/features/fabric-catalog/hooks/useFabricReadinessScore';

type Props = {
  formValues: FabricCatalogFormValues;
  isPublic: boolean;
  lastUpdated?: string | null;
};

export function FabricReadinessScore({ formValues, isPublic, lastUpdated }: Props) {
  const { score, checks } = useFabricReadinessScore(formValues);
  const passedCount = checks.filter(c => c.passed).length;
  const totalCount = checks.length;
  const isPerfect = score === 100;

  const scoreColor =
    score >= 80
      ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
      : score >= 50
        ? 'text-amber-800 bg-amber-50 border-amber-200'
        : 'text-red-800 bg-red-50 border-red-200';

  return (
    <div className={clsx('flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 border rounded-lg mb-6', scoreColor)}>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-sm border font-black text-lg text-slate-700">
          {score}
        </div>
        <div>
          <div className="font-bold text-sm flex items-center gap-2">
            {LABELS.SCORE_TITLE}
            {isPerfect && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                100%
              </span>
            )}
            {isPublic && (
              <Badge variant="success" className="text-[10px] py-0 px-1.5">
                {LABELS.SCORE_PUBLIC_ON}
              </Badge>
            )}
          </div>
          <div className="text-xs opacity-80 mt-1 flex items-center gap-2">
            <span>Hoàn thiện: {passedCount}/{totalCount} tiêu chí</span>
            {isPublic && lastUpdated && (
              <>
                <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                <span>{LABELS.SCORE_LAST_UPDATED} {lastUpdated}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap xl:justify-end">
        {checks.map((check) => (
          <div
            key={check.id}
            className={clsx(
              'flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full border bg-white shadow-sm',
              check.passed
                ? 'border-emerald-200 text-emerald-700'
                : 'border-amber-200 text-amber-700'
            )}
          >
            <Icon
              name={check.passed ? 'Check' : 'TriangleAlert'}
              size={12}
              className={check.passed ? 'text-emerald-500' : 'text-amber-500'}
            />
            <span>{check.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
