import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

import { useCreateGoodsReceipt } from '@/application/purchase-orders';
import { goodsReceiptFormSchema } from '@/domain/purchase-orders';
import type {
  GoodsReceiptFormValues,
  PurchaseOrder,
  PurchaseOrderItem,
} from '@/domain/purchase-orders';
import { Button, CancelButton, FormattedInput } from '@/shared/components';

interface GoodsReceiptFormProps {
  po: PurchaseOrder;
  onClose: () => void;
}

export function GoodsReceiptForm({ po, onClose }: GoodsReceiptFormProps) {
  const createMutation = useCreateGoodsReceipt();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<GoodsReceiptFormValues>({
    resolver: zodResolver(goodsReceiptFormSchema),
    defaultValues: {
      po_id: po.id,
      received_date: dayjs().format('YYYY-MM-DD'),
      items:
        po.items
          ?.filter((item) => item.remaining_qty && item.remaining_qty > 0)
          .map((item) => ({
            po_item_id: item.id!,
            received_qty: item.remaining_qty!,
            unit_price: item.unit_price,
            remaining_qty: item.remaining_qty!,
          })) || [],
    },
  });

  const { fields } = useFieldArray({
    control,
    name: 'items',
  });

  const isPending = isSubmitting || createMutation.isPending;

  async function onSubmit(values: GoodsReceiptFormValues) {
    // Filter out items with 0 received_qty before submission
    const filteredValues = {
      ...values,
      items: values.items
        .filter((it) => it.received_qty > 0)
        .map((it) => ({
          ...it,
        })),
    };

    if (filteredValues.items.length === 0) {
      toast.error('Vui lòng nhập số lượng cho ít nhất 1 mặt hàng');
      return;
    }

    try {
      await createMutation.mutateAsync(filteredValues);
      toast.success('Nhập kho thành công');
      onClose();
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Có lỗi xảy ra khi nhập kho';
      toast.error(msg);
    }
  }

  // Get item details for display
  const getItemDetail = (poItemId: string) => {
    return po.items?.find((it: PurchaseOrderItem) => it.id === poItemId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-border flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold m-0">Nhập kho (Goods Receipt)</h2>
            <p className="text-sm text-muted mt-1">PO: {po.po_code}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-2xl"
          >
            &times;
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form
            id="gr-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
            noValidate
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-field">
                <label>
                  Ngày nhập kho <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="field-input"
                  {...register('received_date')}
                />
                {errors.received_date && (
                  <span className="text-red-500 text-sm mt-1 block">
                    {errors.received_date.message}
                  </span>
                )}
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-sm text-muted border-b border-border">
                  <tr>
                    <th className="p-3">Nguyên liệu</th>
                    <th className="p-3 text-right">SL Đặt</th>
                    <th className="p-3 text-right">Còn lại</th>
                    <th className="p-3 w-40">SL Thực nhận</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {fields.map((field, index) => {
                    const detail = getItemDetail(field.po_item_id);
                    if (!detail) return null;
                    return (
                      <tr key={field.id} className="hover:bg-gray-50/50">
                        <td className="p-3">
                          <div className="font-medium">
                            {detail.material_id}
                          </div>
                          <div className="text-xs text-muted">
                            Đơn vị: {detail.uom}
                          </div>
                        </td>
                        <td className="p-3 text-right">{detail.ordered_qty}</td>
                        <td className="p-3 text-right text-orange-600 font-medium">
                          {detail.remaining_qty}
                        </td>
                        <td className="p-3">
                          <Controller
                            name={`items.${index}.received_qty`}
                            control={control}
                            render={({
                              field: { value, onChange, onBlur },
                            }) => (
                              <FormattedInput
                                className={`field-input text-right ${errors.items?.[index]?.received_qty ? 'border-red-500' : ''}`}
                                value={value}
                                onChange={(v) => onChange(v || 0)}
                                onBlur={onBlur}
                                placeholder="0"
                              />
                            )}
                          />
                          {errors.items?.[index]?.received_qty && (
                            <span className="text-red-500 text-xs mt-1 block">
                              Lỗi
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {fields.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-muted">
                        Tất cả mặt hàng đã được nhập đủ.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {errors.items?.root && (
              <div className="text-red-500 text-sm">
                {errors.items.root.message}
              </div>
            )}
          </form>
        </div>

        <div className="p-4 border-t border-border bg-gray-50 flex justify-end gap-3">
          <CancelButton onClick={onClose} disabled={isPending} />
          <Button
            form="gr-form"
            type="submit"
            variant="primary"
            disabled={fields.length === 0}
            isLoading={isPending}
          >
            Xác nhận nhập kho
          </Button>
        </div>
      </div>
    </div>
  );
}
