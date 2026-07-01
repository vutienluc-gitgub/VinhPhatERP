import { useFormContext, useFieldArray, Controller } from 'react-hook-form';

import { Button, Icon, Switch } from '@/shared/components';
import { NumericInput, MoneyInput, MoneyText } from '@/shared/value';
import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';
import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';
import { getLowestPrice } from '@/features/fabric-catalog/fabric-catalog.utils';

type FabricPublicPricingSectionProps = {
  isExpanded: boolean;
  onToggle: () => void;
};

export function FabricPublicPricingSection({
  isExpanded,
  onToggle,
}: FabricPublicPricingSectionProps) {
  const { control, register, watch } =
    useFormContext<FabricCatalogFormValues>();

  const unit = watch('unit') || 'kg';

  const {
    fields: pricingTiers,
    append: appendTier,
    remove: removeTier,
  } = useFieldArray({
    control,
    name: 'pricing_tiers',
  });

  const lowestPrice = getLowestPrice(pricingTiers);

  return (
    <div className={`accordion-section${isExpanded ? ' is-expanded' : ''}`}>
      <button type="button" className="accordion-header" onClick={onToggle}>
        <div className="accordion-header-title">
          <Icon
            name="ChevronDown"
            className="accordion-header-chevron w-4 h-4"
          />
          <span>{LABELS.SECTION_PRICING}</span>
          {lowestPrice !== null && (
            <span className="lowest-price-badge">
              {LABELS.PRICING_LOWEST_PREFIX}{' '}
              <MoneyText value={lowestPrice} suffix={`đ/${unit}`} />
            </span>
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="accordion-content space-y-4">
          {pricingTiers.length > 0 && (
            <div className="pricing-tier-preview">
              {pricingTiers.map((tier) => (
                <div className="pricing-tier-preview-card" key={tier.id}>
                  <div className="pricing-tier-preview-qty">
                    {tier.min_quantity}
                    {tier.max_quantity ? `–${tier.max_quantity}` : '+'} {unit}
                  </div>
                  <div className="pricing-tier-preview-price">
                    <MoneyText value={tier.unit_price} suffix="đ" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-4 mb-2">
            <h4 className="font-semibold text-sm">
              {LABELS.PRICING_EDIT_TITLE}
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendTier({
                  min_quantity: 0,
                  max_quantity: null,
                  unit_price: 0,
                  currency: 'VND',
                  display_label: '',
                  is_public_visible: true,
                })
              }
            >
              <Icon name="Plus" className="w-4 h-4 mr-1" />{' '}
              {LABELS.PRICING_ADD_TIER}
            </Button>
          </div>

          {pricingTiers.length > 0 ? (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="p-3 w-32">{LABELS.PRICING_COL_MIN}</th>
                    <th className="p-3 w-32">{LABELS.PRICING_COL_MAX}</th>
                    <th className="p-3 w-40">{LABELS.PRICING_COL_PRICE}</th>
                    <th className="p-3">{LABELS.PRICING_COL_LABEL}</th>
                    <th className="p-3 w-20 text-center">
                      {LABELS.PRICING_COL_PUBLIC}
                    </th>
                    <th className="p-3 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pricingTiers.map((field, index) => (
                    <tr key={field.id} className="bg-white">
                      <td className="p-2">
                        <Controller
                          name={`pricing_tiers.${index}.min_quantity`}
                          control={control}
                          render={({ field: ctrlField }) => (
                            <NumericInput
                              {...ctrlField}
                              className="text-sm px-2 py-1.5 w-full"
                            />
                          )}
                        />
                      </td>
                      <td className="p-2">
                        <Controller
                          name={`pricing_tiers.${index}.max_quantity`}
                          control={control}
                          render={({ field: ctrlField }) => (
                            <NumericInput
                              {...ctrlField}
                              className="text-sm px-2 py-1.5 w-full"
                              placeholder={LABELS.PRICING_MAX_PLACEHOLDER}
                            />
                          )}
                        />
                      </td>
                      <td className="p-2">
                        <Controller
                          name={`pricing_tiers.${index}.unit_price`}
                          control={control}
                          render={({ field: ctrlField }) => (
                            <MoneyInput
                              {...ctrlField}
                              className="text-sm px-2 py-1.5 w-full"
                            />
                          )}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          className="field-input text-sm px-2 py-1.5 w-full"
                          type="text"
                          placeholder={LABELS.PRICING_LABEL_PLACEHOLDER}
                          {...register(`pricing_tiers.${index}.display_label`)}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <Controller
                          name={`pricing_tiers.${index}.is_public_visible`}
                          control={control}
                          render={({ field: switchField }) => (
                            <Switch
                              checked={switchField.value}
                              onChange={switchField.onChange}
                            />
                          )}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-700 p-1"
                          onClick={() => removeTier(index)}
                          title="Xóa bậc giá"
                        >
                          <Icon name="Trash2" className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 border border-dashed border-slate-300 rounded-lg text-center text-muted text-sm bg-slate-50">
              {LABELS.PRICING_EMPTY}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
