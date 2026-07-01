import { useFormContext } from 'react-hook-form';

import { Icon } from '@/shared/components';
import { WeightField, QuantityField } from '@/shared/value';
import { NumericField } from '@/shared/value/core/NumericField';
import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';
import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';

type FabricPublicPlannerSectionProps = {
  isExpanded: boolean;
  onToggle: () => void;
};

export function FabricPublicPlannerSection({
  isExpanded,
  onToggle,
}: FabricPublicPlannerSectionProps) {
  const { control } = useFormContext<FabricCatalogFormValues>();

  return (
    <div className={`accordion-section${isExpanded ? ' is-expanded' : ''}`}>
      <button type="button" className="accordion-header" onClick={onToggle}>
        <div className="accordion-header-title">
          <Icon
            name="ChevronDown"
            className="accordion-header-chevron w-4 h-4"
          />
          <span>{LABELS.SECTION_PLANNER}</span>
        </div>
      </button>
      {isExpanded && (
        <div className="accordion-content space-y-4">
          <div>
            <div className="planner-group-label">{LABELS.PLANNER_REQUIRED}</div>
            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
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
            </div>
          </div>

          <div>
            <div className="planner-group-label">{LABELS.PLANNER_ADVANCED}</div>
            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
              <NumericField
                control={control}
                name="b2b_planner.yield_factor"
                label={LABELS.YIELD_LABEL}
                formatOptions={{ decimals: 2 }}
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
          </div>
        </div>
      )}
    </div>
  );
}
