import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

import { useCreatePurchaseOrder } from '@/application/purchase-orders';
import { useActiveSuppliers } from '@/application/crm';
import { purchaseOrderFormSchema } from '@/domain/purchase-orders';
import type { PurchaseOrderFormValues } from '@/domain/purchase-orders';
import { fetchSupplierPrice } from '@/api/suppliers.api';
import {
  Button,
  CancelButton,
  Combobox,
  CurrencyInput,
  FormattedInput,
} from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';
import { sumBy } from '@/shared/utils/array.util';
import { getErrorMessage } from '@/shared/utils/error';

export function POCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreatePurchaseOrder();
  const { data: suppliers = [], isLoading: isLoadingSuppliers } =
    useActiveSuppliers();

  const supplierOptions = suppliers.map((s) => ({
    value: s.id,
    label: s.name,
    code: s.code,
  }));

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderFormSchema),
    defaultValues: {
      supplier_id: '',
      supplier_name_snapshot: '',
      order_date: dayjs().format('YYYY-MM-DD'),
      expected_date: '',
      items: [{ material_id: '', uom: 'kg', ordered_qty: 0, unit_price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchItems = watch('items');
  const totalAmount = sumBy(
    watchItems,
    (curr) => Number(curr.ordered_qty || 0) * Number(curr.unit_price || 0),
  );

  const isPending = isSubmitting || createMutation.isPending;

  async function onSubmit(values: PurchaseOrderFormValues) {
    try {
      await createMutation.mutateAsync(values);
      toast.success('Tạo Purchase Order thành công');
      navigate('/purchase-orders');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tạo PO: ' + getErrorMessage(error));
    }
  }

  const handleMaterialBlur = async (index: number, materialId: string) => {
    const supId = watch('supplier_id');
    if (!supId || !materialId) return;
    try {
      const priceInfo = await fetchSupplierPrice(supId, materialId);
      if (priceInfo) {
        setValue(`items.${index}.unit_price`, priceInfo.unit_price, {
          shouldValidate: true,
        });
        setValue(
          `items.${index}.uom`,
          priceInfo.uom as 'kg' | 'cây' | 'mét' | 'cuộn',
        );
        // We can optionally store moq in a local state to show warnings.
        // For simplicity, we just notify user or we can add it to the DOM.
        if (priceInfo.moq > 0) {
          toast(
            `Nhà cung cấp này yêu cầu MOQ: ${priceInfo.moq} ${priceInfo.uom} cho mã ${materialId}`,
            { icon: 'ℹ️' },
          );
        }
      }
    } catch (_e) {
      // ignore
    }
  };

  if (isLoadingSuppliers) {
    return (
      <div className="page-container p-4 max-w-5xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container p-4 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold m-0">Tạo Đơn Đặt Hàng (PO)</h1>
          <p className="text-muted mt-1">Lập phiếu đặt mua nguyên liệu mới</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-surface rounded-xl shadow-sm border border-border p-6"
        noValidate
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="form-field">
            <label>
              Nhà cung cấp <span className="text-red-500">*</span>
            </label>
            <Controller
              name="supplier_id"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={supplierOptions}
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val);
                    const sup = suppliers.find((s) => s.id === val);
                    if (sup) setValue('supplier_name_snapshot', sup.name);
                  }}
                  placeholder="-- Chọn nhà cung cấp --"
                />
              )}
            />
            {errors.supplier_id && (
              <span className="text-red-500 text-sm mt-1 block">
                {errors.supplier_id.message}
              </span>
            )}
          </div>

          <div className="form-field">
            <label>
              Ngày đặt hàng <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="field-input"
              {...register('order_date')}
            />
            {errors.order_date && (
              <span className="text-red-500 text-sm mt-1 block">
                {errors.order_date.message}
              </span>
            )}
          </div>

          <div className="form-field">
            <label>Ngày dự kiến giao</label>
            <input
              type="date"
              className="field-input"
              {...register('expected_date')}
            />
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-lg m-0">Danh sách nguyên liệu</h3>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              append({
                material_id: '',
                uom: 'kg',
                ordered_qty: 0,
                unit_price: 0,
              })
            }
          >
            + Thêm dòng
          </Button>
        </div>

        {errors.items?.root && (
          <div className="text-red-500 text-sm mb-4">
            {errors.items.root.message}
          </div>
        )}

        <div className="space-y-4 mb-6">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="p-4 border border-border rounded-lg bg-gray-50/50 relative"
            >
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded bg-red-100 text-red-600 hover:bg-red-200"
                >
                  &times;
                </button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pr-6">
                <div className="form-field">
                  <label>
                    Mã / Tên nguyên liệu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="VD: Sợi Cotton 100%"
                    {...register(`items.${index}.material_id`)}
                    onBlur={(e) => {
                      register(`items.${index}.material_id`).onBlur(e);
                      handleMaterialBlur(index, e.target.value);
                    }}
                  />
                  {errors.items?.[index]?.material_id && (
                    <span className="text-red-500 text-sm mt-1 block">
                      {errors.items[index].material_id.message}
                    </span>
                  )}
                </div>

                <div className="form-field">
                  <label>Đơn vị</label>
                  <select
                    className="field-input"
                    {...register(`items.${index}.uom`)}
                  >
                    <option value="kg">kg</option>
                    <option value="cây">cây</option>
                    <option value="mét">mét</option>
                    <option value="cuộn">cuộn</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>
                    Số lượng <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name={`items.${index}.ordered_qty`}
                    control={control}
                    render={({ field }) => (
                      <FormattedInput
                        className="field-input"
                        value={field.value}
                        onChange={(v) => field.onChange(v || 0)}
                        onBlur={field.onBlur}
                        placeholder="0"
                      />
                    )}
                  />
                  {errors.items?.[index]?.ordered_qty && (
                    <span className="text-red-500 text-sm mt-1 block">
                      {errors.items[index].ordered_qty.message}
                    </span>
                  )}
                </div>

                <div className="form-field">
                  <label>
                    Đơn giá <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name={`items.${index}.unit_price`}
                    control={control}
                    render={({ field }) => (
                      <CurrencyInput
                        className="field-input"
                        value={field.value}
                        onChange={(v) => field.onChange(v || 0)}
                        onBlur={field.onBlur}
                        placeholder="0"
                      />
                    )}
                  />
                  {errors.items?.[index]?.unit_price && (
                    <span className="text-red-500 text-sm mt-1 block">
                      {errors.items[index].unit_price.message}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-3 text-right text-sm text-muted">
                Thành tiền:{' '}
                <span className="font-semibold text-foreground">
                  {formatCurrency(
                    (watchItems[index]?.ordered_qty || 0) *
                      (watchItems[index]?.unit_price || 0),
                  )}{' '}
                  đ
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mb-8 pt-4 border-t border-border">
          <div className="text-xl">
            Tổng cộng:{' '}
            <span className="font-bold text-primary ml-4">
              {formatCurrency(totalAmount)} đ
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <CancelButton
            onClick={() => navigate('/purchase-orders')}
            disabled={isPending}
          />
          <Button type="submit" variant="primary" isLoading={isPending}>
            Tạo Đơn Đặt Hàng
          </Button>
        </div>
      </form>
    </div>
  );
}
