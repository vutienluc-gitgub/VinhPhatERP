import { UseFormReturn, Controller } from 'react-hook-form';

import type { PurchaseOrderFormValues } from '@/domain/purchase-orders';
import { Button, CurrencyInput, Icon } from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';
import { PO_CONSTANTS } from '@/features/purchase-orders/purchase-orders.constants';

interface POPaymentPanelProps {
  form: UseFormReturn<PurchaseOrderFormValues>;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  isPending: boolean;
  onSubmit: (values: PurchaseOrderFormValues) => Promise<void>;
}

export function POPaymentPanel({
  form,
  subtotal,
  vatAmount,
  totalAmount,
  isPending,
  onSubmit,
}: POPaymentPanelProps) {
  const { register, control, watch, handleSubmit } = form;

  const watchVatRate = watch('vat_rate') || 0;
  const watchShippingFee = watch('shipping_fee') || 0;
  const watchCurrency = watch('currency') || 'VND';

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border p-6 sticky top-20">
      <h3 className="font-semibold text-lg mb-6 pb-2 border-b border-border m-0">
        {PO_CONSTANTS.SECTION_PAYMENT}
      </h3>

      <div className="space-y-6">
        {/* Input Parameters Group */}
        <div className="p-4 bg-gray-50/40 rounded-xl border border-border space-y-4">
          <div className="form-field">
            <label>{PO_CONSTANTS.LABEL_CURRENCY}</label>
            <select
              className="field-select h-9 w-full bg-white font-normal"
              {...register('currency')}
            >
              {PO_CONSTANTS.CURRENCY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <label>{PO_CONSTANTS.VAT_RATE}</label>
              <Controller
                name="vat_rate"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    value={field.value}
                    onChange={(val) => field.onChange(val || 0)}
                    placeholder="0"
                    className="h-9 w-full text-right bg-white font-medium tabular-nums"
                  />
                )}
              />
            </div>

            <div className="form-field">
              <label>{PO_CONSTANTS.SHIPPING_FEE}</label>
              <Controller
                name="shipping_fee"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    value={field.value}
                    onChange={(val) => field.onChange(val || 0)}
                    placeholder="0"
                    className="h-9 w-full text-right bg-white font-medium tabular-nums"
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* Invoice Financial Breakdown */}
        <div className="bg-gray-50/20 rounded-xl p-4 border border-dashed border-border flex flex-col gap-3.5">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>{PO_CONSTANTS.SUBTOTAL}</span>
            <span className="font-semibold tabular-nums text-gray-800">
              {formatCurrency(subtotal)} {watchCurrency}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>VAT ({watchVatRate}%)</span>
            <span className="font-semibold tabular-nums text-gray-800">
              {formatCurrency(vatAmount)} {watchCurrency}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>{PO_CONSTANTS.SHIPPING_FEE}</span>
            <span className="font-semibold tabular-nums text-gray-800">
              {formatCurrency(watchShippingFee)} {watchCurrency}
            </span>
          </div>

          <div className="border-t border-dashed border-gray-300 pt-3.5">
            <div className="flex justify-between items-baseline">
              <span className="font-bold text-sm text-gray-800 uppercase tracking-wider">
                {PO_CONSTANTS.GRAND_TOTAL}
              </span>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-primary tabular-nums">
                  {formatCurrency(totalAmount)}
                </span>
                <span className="text-xs font-bold text-gray-500 ml-1.5 uppercase">
                  {watchCurrency}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="button"
            variant="primary"
            className="w-full py-3 h-auto text-base"
            isLoading={isPending}
            onClick={handleSubmit(onSubmit)}
          >
            <Icon name="Check" size={18} className="mr-2" />
            {PO_CONSTANTS.BTN_CONFIRM_CREATE}
          </Button>
        </div>
      </div>
    </div>
  );
}
