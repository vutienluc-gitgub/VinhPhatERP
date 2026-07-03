import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { Icon } from '@/shared/components';
import { WeightField, QuantityField } from '@/shared/value';
import { NumericField } from '@/shared/value/core/NumericField';
import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';
import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';

export function FabricPublicPlannerSection() {
  const { control } = useFormContext<FabricCatalogFormValues>();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-slate-900">
          {LABELS.SECTION_PLANNER}
        </h3>
      </div>

      <div className="space-y-4">
        {/* Basic View: 2 columns */}
        <div className="grid grid-cols-2 gap-4">
          <WeightField
            control={control}
            name="b2b_planner.minimum_order_qty_kg"
            label={LABELS.MOQ_LABEL}
            allowNegative={false}
          />
          <QuantityField
            control={control}
            name="b2b_planner.lead_time_days"
            label={LABELS.LEAD_TIME_LABEL}
            suffix="ngày"
            allowNegative={false}
          />
          <WeightField
            control={control}
            name="b2b_planner.production_capacity_monthly_tons"
            label={LABELS.CAPACITY_LABEL}
            suffix="tấn"
            allowNegative={false}
          />
          <WeightField
            control={control}
            name="b2b_planner.standard_consumption_kg"
            label={LABELS.STANDARD_CONSUMPTION_LABEL}
            suffix="kg"
            allowNegative={false}
          />
        </div>

        {/* Advanced Toggle */}
        <div className="pt-2">
          <button
            type="button"
            className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          >
            <span>Advanced settings</span>
            <Icon
              name="ChevronDown"
              size={16}
              className={`ml-1 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Advanced View */}
        {isAdvancedOpen && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <NumericField
              control={control}
              name="b2b_planner.yield_factor"
              label={LABELS.YIELD_LABEL}
              formatOptions={{ decimals: 2 }}
              allowNegative={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
