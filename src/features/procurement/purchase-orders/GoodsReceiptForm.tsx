import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
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
import { Button, CancelButton } from '@/shared/components';
import { QuantityInput } from '@/shared/value';

import { PO_CONSTANTS } from './purchase-orders.constants';

interface GoodsReceiptFormProps {
  po: PurchaseOrder;
  globalMaterials?: { id: string; name: string }[];
  onClose: () => void;
}

export function GoodsReceiptForm({
  po,
  globalMaterials,
  onClose,
}: GoodsReceiptFormProps) {
  const createMutation = useCreateGoodsReceipt();
  const navigate = useNavigate();

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
      toast.error(PO_CONSTANTS.GR_MSG_NO_QTY);
      return;
    }

    try {
      const result = await createMutation.mutateAsync(filteredValues);
      toast.success(PO_CONSTANTS.GR_MSG_SUCCESS);
      onClose();

      // Simple prompt to ask if they want to create Yarn Receipt (Inventory)
      if (
        window.confirm(
          'Bạn có muốn tạo Phiếu Nhập Kho Sợi (vật lý) cho lô hàng này ngay không?',
        )
      ) {
        const grId =
          typeof result === 'string'
            ? result
            : (result as Record<string, unknown>)?.id;
        if (grId) {
          navigate(`/yarn-receipts?fromGoodsReceipt=${grId}`);
        } else {
          toast.error('Không tìm thấy ID phiếu nhập kho để chuyển tiếp.');
        }
      }
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error !== null && 'message' in error
            ? String((error as { message: string }).message)
            : PO_CONSTANTS.GR_MSG_ERROR;
      toast.error(msg);
    }
  }

  // Get item details for display
  const getItemDetail = (poItemId: string) => {
    return po.items?.find((it: PurchaseOrderItem) => it.id === poItemId);
  };

  const getMaterialName = (id: string) => {
    if (!globalMaterials) return id;
    const found = globalMaterials.find((m) => m.id === id);
    return found ? found.name : id;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-border flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold m-0">{PO_CONSTANTS.GR_TITLE}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              PO: {po.po_code}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-2xl"
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
                  {PO_CONSTANTS.GR_DATE} <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className="field-input"
                  {...register('received_date')}
                />
                {errors.received_date && (
                  <span className="text-danger text-sm mt-1 block">
                    {errors.received_date.message}
                  </span>
                )}
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-sm text-muted-foreground border-b border-border">
                  <tr>
                    <th className="p-3">{PO_CONSTANTS.GR_COL_MATERIAL}</th>
                    <th className="p-3 text-right">
                      {PO_CONSTANTS.GR_COL_ORDERED}
                    </th>
                    <th className="p-3 text-right">
                      {PO_CONSTANTS.GR_COL_REMAINING}
                    </th>
                    <th className="p-3 w-40">{PO_CONSTANTS.GR_COL_RECEIVED}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {fields.map((field, index) => {
                    const detail = getItemDetail(field.po_item_id);
                    if (!detail) return null;
                    return (
                      <tr key={field.id} className="hover:bg-gray-50/50">
                        <td className="p-3">
                          <div className="font-medium text-sm">
                            {getMaterialName(detail.material_id)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Đơn vị: {detail.uom}
                          </div>
                        </td>
                        <td className="p-3 text-right">{detail.ordered_qty}</td>
                        <td className="p-3 text-right text-warning font-medium">
                          {detail.remaining_qty}
                        </td>
                        <td className="p-3">
                          <Controller
                            name={`items.${index}.received_qty`}
                            control={control}
                            render={({
                              field: { value, onChange, onBlur },
                            }) => (
                              <QuantityInput
                                className={`field-input text-right ${errors.items?.[index]?.received_qty ? 'border-danger' : ''}`}
                                value={value}
                                onChange={onChange}
                                onBlur={onBlur}
                                placeholder="0"
                                decimals={2}
                              />
                            )}
                          />
                          {errors.items?.[index]?.received_qty && (
                            <span className="text-danger text-xs mt-1 block">
                              {PO_CONSTANTS.GR_ERROR_LABEL}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {fields.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-4 text-center text-muted-foreground"
                      >
                        {PO_CONSTANTS.GR_ALL_RECEIVED}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {errors.items?.root && (
              <div className="text-danger text-sm">
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
            {PO_CONSTANTS.GR_BTN_CONFIRM}
          </Button>
        </div>
      </div>
    </div>
  );
}
