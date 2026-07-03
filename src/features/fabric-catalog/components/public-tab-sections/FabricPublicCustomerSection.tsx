import { useFormContext, Controller } from 'react-hook-form';

import { Icon } from '@/shared/components';
import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';
import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';

export function FabricPublicCustomerSection() {
  const { control } = useFormContext<FabricCatalogFormValues>();

  return (
    <div className="space-y-4 mt-8">
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-slate-900">
          Trải nghiệm khách hàng
        </h3>
      </div>

      <div className="space-y-6">
        {/* Stock Display Mode - Segmented Control */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-3">
            {LABELS.STOCK_DISPLAY_LABEL}
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <Controller
                name="b2b_planner.public_stock_display"
                control={control}
                render={({ field }) => (
                  <input
                    type="radio"
                    className="w-4 h-4 rounded-full border-slate-300 text-emerald-600 focus:ring-emerald-600"
                    checked={field.value === 'none'}
                    onChange={() => field.onChange('none')}
                  />
                )}
              />
              <span className="flex items-center text-sm text-slate-700 group-hover:text-slate-900">
                <Icon
                  name="EyeOff"
                  size={16}
                  className="text-emerald-500 mr-1.5"
                />
                {LABELS.STOCK_DISPLAY_NONE}
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group">
              <Controller
                name="b2b_planner.public_stock_display"
                control={control}
                render={({ field }) => (
                  <input
                    type="radio"
                    className="w-4 h-4 rounded-full border-slate-300 text-emerald-600 focus:ring-emerald-600"
                    checked={field.value === 'status'}
                    onChange={() => field.onChange('status')}
                  />
                )}
              />
              <span className="flex items-center text-sm text-slate-700 group-hover:text-slate-900">
                <Icon
                  name="Activity"
                  size={16}
                  className="text-emerald-500 mr-1.5"
                />
                {LABELS.STOCK_DISPLAY_STATUS}
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group">
              <Controller
                name="b2b_planner.public_stock_display"
                control={control}
                render={({ field }) => (
                  <input
                    type="radio"
                    className="w-4 h-4 rounded-full border-slate-300 text-emerald-600 focus:ring-emerald-600"
                    checked={field.value === 'quantity'}
                    onChange={() => field.onChange('quantity')}
                  />
                )}
              />
              <span className="flex items-center text-sm text-slate-700 group-hover:text-slate-900">
                <Icon
                  name="Hash"
                  size={16}
                  className="text-emerald-500 mr-1.5"
                />
                {LABELS.STOCK_DISPLAY_QUANTITY}
              </span>
            </label>
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        {/* Trust Signals */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-3">
            {LABELS.TRUST_SIGNALS_LABEL}
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <Controller
                name="b2b_planner.trust_has_sample"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                    checked={!!field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
              <span className="flex items-center text-sm text-slate-700 group-hover:text-slate-900">
                <Icon
                  name="FlaskConical"
                  size={16}
                  className="text-emerald-500 mr-1.5"
                />
                {LABELS.TRUST_HAS_SAMPLE}
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group">
              <Controller
                name="b2b_planner.trust_fast_delivery"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                    checked={!!field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
              <span className="flex items-center text-sm text-slate-700 group-hover:text-slate-900">
                <Icon
                  name="Truck"
                  size={16}
                  className="text-emerald-500 mr-1.5"
                />
                {LABELS.TRUST_FAST_DELIVERY}
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group">
              <Controller
                name="b2b_planner.trust_tech_support"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                    checked={!!field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
              <span className="flex items-center text-sm text-slate-700 group-hover:text-slate-900">
                <Icon
                  name="Wrench"
                  size={16}
                  className="text-emerald-500 mr-1.5"
                />
                {LABELS.TRUST_TECH_SUPPORT}
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
