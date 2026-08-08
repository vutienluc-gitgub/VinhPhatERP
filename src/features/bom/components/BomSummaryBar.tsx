import { useFormContext, useWatch } from 'react-hook-form';

import { sumBy } from '@/shared/utils/array.util';
import type { BomTemplateFormData } from '@/schema/bom.schema';

export function BomSummaryBar() {
  const { control } = useFormContext<BomTemplateFormData>();

  const watchItems = useWatch({ control, name: 'bom_yarn_items' }) || [];
  const watchWidthCm = useWatch({ control, name: 'target_width_cm' });
  const watchGsm = useWatch({ control, name: 'target_gsm' });
  const watchLoss = useWatch({ control, name: 'standard_loss_pct' }) || 0;

  if (watchItems.length === 0 || !watchWidthCm || !watchGsm) {
    return null;
  }

  const netConsumption = sumBy(
    watchItems,
    (item) => Number(item.consumption_kg_per_m) || 0,
  );

  const grossConsumption =
    watchLoss < 100 ? netConsumption / (1 - watchLoss / 100) : 0;

  const productionConsumption = grossConsumption * 1000;

  return (
    <div className="mt-4 p-4 rounded-xl bg-surface-subtle border border-border">
      <span className="font-bold text-lg block mb-3">
        Tổng kết định mức / 1 mét vải
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Net */}
        <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-surface border border-border">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
            Tiêu hao tịnh (Net)
          </span>
          <span className="text-xl font-bold text-text tabular-nums">
            {netConsumption.toFixed(4)}{' '}
            <span className="text-sm font-normal text-muted-foreground">
              kg/m
            </span>
          </span>
          <span className="text-[10px] text-muted-foreground">
            Không tính hao hụt
          </span>
        </div>

        {/* Gross */}
        <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <span className="text-[11px] text-foreground uppercase tracking-wide font-semibold">
            Thực cấp mộc (Gross)
          </span>
          <span className="text-xl font-bold text-foreground tabular-nums">
            {watchLoss < 100 ? grossConsumption.toFixed(4) : '0.0000'}{' '}
            <span className="text-sm font-normal text-foreground/70">kg/m</span>
          </span>
          <span className="text-[10px] text-foreground/70">
            Gồm {watchLoss}% hao hụt
          </span>
        </div>

        {/* 1000m reference */}
        <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-success/5 border border-success/20">
          <span className="text-[11px] text-success uppercase tracking-wide font-semibold">
            Xuất kho cho 1.000m
          </span>
          <span className="text-xl font-bold text-success tabular-nums">
            {watchLoss < 100 ? productionConsumption.toFixed(1) : '0.0'}{' '}
            <span className="text-sm font-normal text-success/70">kg</span>
          </span>
          <span className="text-[10px] text-success/70">
            Ước tính đặt hàng nguyên liệu
          </span>
        </div>
      </div>
    </div>
  );
}
