import { useState } from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';

import { Button, Icon, Switch } from '@/shared/components';
import { NumericInput, MoneyInput, MoneyText } from '@/shared/value';
import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';
import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';
import { getLowestPrice } from '@/features/fabric-catalog/fabric-catalog.utils';

export function FabricPublicPricingSection() {
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = useFormContext<FabricCatalogFormValues>();

  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const unit = watch('unit') || 'kg';
  const moq = watch('b2b_planner.minimum_order_qty_kg') ?? 0;

  const {
    fields: pricingTiers,
    append: appendTier,
    remove: removeTier,
  } = useFieldArray({
    control,
    name: 'pricing_tiers',
  });

  const lowestPrice = getLowestPrice(pricingTiers);
  const visibleTiersCount = pricingTiers.filter(
    (t) => t.is_public_visible,
  ).length;
  const hiddenTiersCount = pricingTiers.length - visibleTiersCount;

  const hasPublicMoqConflict =
    moq > 0 &&
    pricingTiers.some(
      (tier) => tier.is_public_visible && tier.min_quantity < moq,
    );

  function handleAppendTier() {
    appendTier({
      min_quantity: pricingTiers.length === 0 && moq > 0 ? moq : 0,
      max_quantity: null,
      unit_price: 0,
      currency: 'VND',
      display_label: '',
      is_public_visible: true,
    });
  }

  return (
    <div className="space-y-4 mt-8">
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-slate-900">
          {LABELS.SECTION_PRICING}
        </h3>
      </div>

      <div className="space-y-4">
        {/* KPI Pricing Summary */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Lowest Price
            </div>
            <div className="font-bold text-slate-900 text-lg">
              {lowestPrice !== null ? (
                <MoneyText value={lowestPrice} suffix={`đ/${unit}`} />
              ) : (
                '—'
              )}
            </div>
          </div>
          <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              MOQ
            </div>
            <div className="font-bold text-slate-900 text-lg">
              {moq} {unit}
            </div>
          </div>
          <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Visible Tiers
            </div>
            <div className="font-bold text-slate-900 text-lg">
              {visibleTiersCount}
            </div>
          </div>
          <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Hidden
            </div>
            <div className="font-bold text-slate-400 text-lg">
              {hiddenTiersCount}
            </div>
          </div>
        </div>

        {/* Editor Toggle */}
        <div className="pt-2">
          <button
            type="button"
            className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
            onClick={() => setIsEditorOpen(!isEditorOpen)}
          >
            <span>Edit Pricing</span>
            <Icon
              name="ChevronDown"
              size={16}
              className={`ml-1 transition-transform ${isEditorOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Full Tier Editor */}
        {isEditorOpen && (
          <div className="pt-4 border-t border-slate-100 space-y-4">
            {hasPublicMoqConflict && (
              <div className="pricing-tier-moq-warning">
                <Icon
                  name="AlertTriangle"
                  className="w-4 h-4 mt-0.5 shrink-0"
                />
                <span>
                  {LABELS.PRICING_MOQ_CONFLICT_WARNING.replace(
                    '{moq}',
                    String(moq),
                  )}
                </span>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAppendTier}
              >
                <Icon name="Plus" className="w-4 h-4 mr-1" />{' '}
                {LABELS.PRICING_ADD_TIER}
              </Button>
            </div>

            {pricingTiers.length > 0 ? (
              <div className="border border-slate-200 rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[600px]">
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
                    {pricingTiers.map((field, index) => {
                      const tierErrors = errors.pricing_tiers?.[index];
                      return (
                        <tr
                          key={field.id}
                          className="bg-white hover:bg-slate-50/50"
                        >
                          <td className="p-2">
                            <Controller
                              name={`pricing_tiers.${index}.min_quantity`}
                              control={control}
                              render={({ field: ctrlField }) => (
                                <div>
                                  <NumericInput
                                    {...ctrlField}
                                    className={`field-input pricing-tier-cell-input h-9 text-sm ${tierErrors?.min_quantity ? ' is-error' : ''}`}
                                  />
                                </div>
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
                                  className="field-input pricing-tier-cell-input h-9 text-sm"
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
                                  className="field-input pricing-tier-cell-input h-9 text-sm"
                                />
                              )}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              className="field-input pricing-tier-cell-input h-9 text-sm"
                              type="text"
                              placeholder={LABELS.PRICING_LABEL_PLACEHOLDER}
                              {...register(
                                `pricing_tiers.${index}.display_label`,
                              )}
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
                              className="text-slate-400 hover:text-red-500 transition-colors p-1"
                              onClick={() => removeTier(index)}
                              title={LABELS.PRICING_DELETE_TIER}
                            >
                              <Icon name="Trash2" className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 border border-dashed border-slate-300 rounded-lg text-center text-slate-500 text-sm bg-slate-50">
                {LABELS.PRICING_EMPTY}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
