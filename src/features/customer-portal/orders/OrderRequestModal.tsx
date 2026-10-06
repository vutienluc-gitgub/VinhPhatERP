import { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { usePortalOrderRequest } from '@/application/crm/portal';
import { Button, Icon, AdaptiveSheet } from '@/shared/components';
import { useFabricCatalogOptions } from '@/shared/hooks/useFabricCatalogOptions';
import { useColorOptions } from '@/shared/hooks/useColorOptions';
import { orderRequestFormSchema } from '@/schema/order-request.schema';
import type { OrderRequestFormValues } from '@/schema/order-request.schema';
import type { PortalOrderItem } from '@/domain/portal/types';

import { OrderRequestItemRow } from './OrderRequestItemRow';

type RequestFormValues = OrderRequestFormValues;

const UNIT_OPTIONS = [
  { value: 'kg', label: 'kg' },
  { value: 'm', label: 'm' },
  { value: 'cây', label: 'Cây' },
];

type OrderRequestModalProps = {
  onClose: () => void;
  onSuccess?: () => void;
  initialFabricType?: string;
  /** Pre-fill form with items from a previous order (re-order flow). */
  initialItems?: PortalOrderItem[];
};

export function OrderRequestModal({
  onClose,
  onSuccess,
  initialFabricType,
  initialItems,
}: OrderRequestModalProps) {
  const { submitOrderRequest, isPending, error } = usePortalOrderRequest();
  const { data: fabricOptions = [] } = useFabricCatalogOptions();
  const { data: colorOptions = [] } = useColorOptions();
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fabricComboOptions = useMemo(
    () =>
      fabricOptions.map((f) => ({
        value: f.name,
        label: f.name,
      })),
    [fabricOptions],
  );

  const defaultItems: RequestFormValues['items'] =
    initialItems && initialItems.length > 0
      ? initialItems.map((item) => ({
          fabric_type: item.fabric_name,
          color_name: item.color ?? '',
          quantity: item.quantity,
          unit: 'kg',
          notes: '',
        }))
      : [
          {
            fabric_type: initialFabricType || '',
            color_name: '',
            quantity: 100,
            unit: 'kg',
            notes: '',
          },
        ];

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RequestFormValues>({
    resolver: zodResolver(orderRequestFormSchema),
    defaultValues: {
      delivery_date: '',
      notes: '',
      items: defaultItems,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  async function onSubmit(values: RequestFormValues) {
    const success = await submitOrderRequest({
      delivery_date: values.delivery_date || null,
      notes: values.notes || '',
      items: values.items.map((i) => ({
        fabric_type: i.fabric_type,
        color_name: i.color_name || '',
        quantity: i.quantity,
        unit: i.unit,
        notes: i.notes || '',
      })),
    });

    if (success) {
      setSubmitSuccess(true);
      onSuccess?.();
    }
  }

  if (submitSuccess) {
    return (
      <AdaptiveSheet
        open
        onClose={onClose}
        title="Yêu cầu đã được gửi!"
        maxWidth={520}
        footer={
          <Button variant="primary" onClick={onClose} className="w-full">
            Đóng
          </Button>
        }
      >
        <div className="text-center py-6 space-y-3">
          <div className="w-14 h-14 bg-success-soft text-success rounded-full flex items-center justify-center mx-auto">
            <Icon name="CheckCircle2" size={32} />
          </div>
          <h3 className="font-semibold text-lg text-foreground">
            Gửi yêu cầu đặt hàng thành công
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Bộ phận kinh doanh Vĩnh Phát sẽ liên hệ xác nhận đơn hàng và báo giá
            trong thời gian sớm nhất.
          </p>
        </div>
      </AdaptiveSheet>
    );
  }

  return (
    <AdaptiveSheet
      open
      onClose={onClose}
      title="Yêu cầu đặt hàng mới"
      maxWidth={680}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="order-request-form"
            disabled={isPending}
            isLoading={isPending}
          >
            {isPending ? 'Đang gửi…' : 'Gửi yêu cầu'}
          </Button>
        </>
      }
    >
      {error && <p className="field-error mb-4">Lỗi: {error}</p>}

      <form
        id="order-request-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="form-grid">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="form-section-title mb-0">Danh sách mặt hàng</h3>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  append({
                    fabric_type: '',
                    color_name: '',
                    quantity: 100,
                    unit: 'kg',
                    notes: '',
                  })
                }
              >
                <Icon name="Plus" size={16} className="mr-1" />
                Thêm dòng
              </Button>
            </div>

            {errors.items?.root && (
              <p className="text-sm text-danger">{errors.items.root.message}</p>
            )}

            <div className="space-y-3">
              {fields.map((field, index) => (
                <OrderRequestItemRow
                  key={field.id}
                  index={index}
                  control={control}
                  register={register}
                  errors={errors}
                  setValue={setValue}
                  onRemove={() => remove(index)}
                  canRemove={fields.length > 1}
                  fabricOptions={fabricOptions}
                  fabricComboOptions={fabricComboOptions}
                  colorOptions={colorOptions}
                  unitOptions={UNIT_OPTIONS}
                />
              ))}
            </div>
          </div>

          <div className="h-px bg-border w-full my-6" />

          <div className="space-y-4 pb-4">
            <h3 className="form-section-title">Thông tin giao hàng</h3>

            <div className="form-field">
              <label htmlFor="delivery_date">Ngày mong muốn nhận hàng</label>
              <input
                id="delivery_date"
                type="date"
                className="field-input"
                {...register('delivery_date')}
              />
            </div>

            <div className="form-field">
              <label htmlFor="notes">Ghi chú chung cho đơn hàng</label>
              <textarea
                id="notes"
                className="field-input"
                rows={3}
                placeholder="Ví dụ: Giao hỏa tốc, liên hệ người A khi giao..."
                {...register('notes')}
              />
            </div>
          </div>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
