import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';

import {
  useAllSupplierPrices,
  useUpsertSupplierPrice,
} from '@/application/crm';
import { Button } from '@/shared/components';
import { MoneyInput, QuantityInput, MoneyText } from '@/shared/value';
import { formatQuantity } from '@/shared/value/core/formatter';
import { SUPPLIER_LABELS as L } from '@/features/procurement/procurement.constants';

type Props = {
  supplierId: string;
};

const priceSchema = z.object({
  material_id: z.string().min(1, 'Vui lòng nhập mã nguyên liệu'),
  unit_price: z.number().min(0, 'Đơn giá không hợp lệ'),
  uom: z.string().min(1, 'Vui lòng chọn đơn vị'),
  moq: z.number().min(0, 'MOQ không hợp lệ'),
  lead_time_days: z.number().min(0, 'Thời gian giao hàng không hợp lệ'),
});

type PriceFormValues = z.infer<typeof priceSchema>;

export function SupplierPriceList({ supplierId }: Props) {
  const { data: prices = [], isLoading } = useAllSupplierPrices(supplierId);
  const upsertMutation = useUpsertSupplierPrice();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PriceFormValues>({
    resolver: zodResolver(priceSchema),
    defaultValues: {
      material_id: '',
      unit_price: 0,
      uom: 'kg',
      moq: 0,
      lead_time_days: 7,
    },
  });

  const [isAdding, setIsAdding] = useState(false);

  const onSubmit = async (values: PriceFormValues) => {
    try {
      await upsertMutation.mutateAsync({
        supplierId,
        priceData: values,
      });
      toast.success(L.MSG_SAVE_SUCCESS);
      setIsAdding(false);
      reset();
    } catch (_error) {
      toast.error(L.MSG_SAVE_ERROR);
    }
  };

  if (isLoading)
    return (
      <div className="p-4 text-center text-muted">{L.LOADING_PRICE_LIST}</div>
    );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg m-0">{L.EFFECTIVE_PRICE_LIST}</h3>
        {!isAdding && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsAdding(true)}
          >
            {L.BTN_ADD_PRICE}
          </Button>
        )}
      </div>

      {isAdding && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-4 bg-gray-50/50 border border-border rounded-lg space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="form-field">
              <label>
                {L.LBL_MATERIAL_CODE} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="field-input"
                {...register('material_id')}
                placeholder={L.MATERIAL_CODE_PLACEHOLDER}
              />
              {errors.material_id && (
                <span className="text-red-500 text-xs">
                  {errors.material_id.message}
                </span>
              )}
            </div>
            <div className="form-field">
              <label>
                {L.LBL_UNIT_PRICE} <span className="text-red-500">*</span>
              </label>
              <Controller
                name="unit_price"
                control={control}
                render={({ field }) => (
                  <MoneyInput
                    className="field-input"
                    value={field.value}
                    onChange={(v) => field.onChange(v || 0)}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>
            <div className="form-field">
              <label>{L.LBL_UNIT}</label>
              <select className="field-input" {...register('uom')}>
                <option value="kg">kg</option>
                <option value="cây">{L.OPT_UNIT_CAY}</option>
                <option value="mét">{L.OPT_UNIT_MET}</option>
                <option value="cuộn">{L.OPT_UNIT_CUON}</option>
              </select>
            </div>
            <div className="form-field">
              <label>{L.LBL_MOQ}</label>
              <Controller
                name="moq"
                control={control}
                render={({ field }) => (
                  <QuantityInput
                    className="field-input"
                    value={field.value}
                    onChange={(v) => field.onChange(v || 0)}
                    onBlur={field.onBlur}
                    decimals={4}
                  />
                )}
              />
            </div>
            <div className="form-field">
              <label>{L.LBL_LEAD_TIME}</label>
              <input
                type="number"
                className="field-input"
                {...register('lead_time_days', { valueAsNumber: true })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsAdding(false);
                reset();
              }}
            >
              {L.BTN_CANCEL}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || upsertMutation.isPending}
            >
              {L.BTN_SAVE_PRICE}
            </Button>
          </div>
        </form>
      )}

      {prices.length === 0 && !isAdding && (
        <div className="text-center py-8 text-muted border border-dashed rounded-lg">
          {L.EMPTY_PRICE_LIST}
        </div>
      )}

      {prices.length > 0 && (
        <div className="table-responsive border border-border rounded-lg">
          <table className="table w-full text-left">
            <thead>
              <tr className="bg-surface-subtle">
                <th className="px-4 py-3 font-semibold text-sm">
                  {L.LBL_MATERIAL_CODE}
                </th>
                <th className="px-4 py-3 font-semibold text-sm text-right">
                  {L.LBL_UNIT_PRICE}
                </th>
                <th className="px-4 py-3 font-semibold text-sm">
                  {L.LBL_UNIT}
                </th>
                <th className="px-4 py-3 font-semibold text-sm text-right">
                  {L.LBL_MOQ}
                </th>
                <th className="px-4 py-3 font-semibold text-sm text-right">
                  Lead Time
                </th>
              </tr>
            </thead>
            <tbody>
              {prices.map((p) => (
                <tr
                  key={p.material_id}
                  className="border-t border-border hover:bg-gray-50/50"
                >
                  <td className="px-4 py-3 font-medium text-sm">
                    {p.material_id}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-primary font-semibold">
                    <MoneyText value={p.unit_price} />
                  </td>
                  <td className="px-4 py-3 text-sm">{p.uom}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    {p.moq > 0 ? formatQuantity(p.moq, 0) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {p.lead_time_days} {L.DAYS}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
