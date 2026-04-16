import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { usePortalOrderRequest } from '@/application/crm/portal';
import { Button, Icon, AdaptiveSheet, Combobox } from '@/shared/components';
import { useFabricCatalogOptions } from '@/shared/hooks/useFabricCatalogOptions';
import {
  useColorOptions,
  toColorComboboxOptions,
} from '@/shared/hooks/useColorOptions';

const requestItemSchema = z.object({
  fabric_type: z.string().trim().min(2, 'Nhập loại vải'),
  color_name: z.string().trim().optional().or(z.literal('')),
  quantity: z
    .number({ invalid_type_error: 'Nhập số lượng' })
    .min(1, 'Số lượng tối thiểu là 1'),
  unit: z.string().min(1, 'Chọn đơn vị'),
  notes: z.string().trim().optional().or(z.literal('')),
});

const requestFormSchema = z.object({
  delivery_date: z.string().optional().or(z.literal('')),
  notes: z.string().trim().optional().or(z.literal('')),
  items: z.array(requestItemSchema).min(1, 'Cần thêm ít nhất 1 mặt hàng'),
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

type OrderRequestModalProps = {
  onClose: () => void;
  onSuccess?: () => void;
  initialFabricType?: string;
};

export function OrderRequestModal({
  onClose,
  onSuccess,
  initialFabricType,
}: OrderRequestModalProps) {
  const { submitOrderRequest, isPending, error } = usePortalOrderRequest();
  const { data: fabricOptions = [] } = useFabricCatalogOptions();
  const { data: colorOptions = [] } = useColorOptions();
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      delivery_date: '',
      notes: '',
      items: [
        {
          fabric_type: initialFabricType || '',
          color_name: '',
          quantity: 100,
          unit: 'kg',
          notes: '',
        },
      ],
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
      if (onSuccess) {
        setTimeout(onSuccess, 2000);
      } else {
        setTimeout(onClose, 2000);
      }
    }
  }

  if (submitSuccess) {
    return (
      <AdaptiveSheet
        open={true}
        onClose={onClose}
        title="Gửi yêu cầu thành công"
      >
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center text-success">
            <Icon name="CheckCircle2" size={32} />
          </div>
          <h3 className="text-xl font-bold">Yêu cầu đã được gửi</h3>
          <p className="text-muted text-sm max-w-xs">
            Chúng tôi đã nhận được yêu cầu đặt hàng của bạn. Nhân viên kinh
            doanh sẽ liên hệ lại trong thời gian sớm nhất để xác nhận và làm báo
            giá chi tiết.
          </p>
          <Button variant="primary" onClick={onClose} className="mt-4">
            Đóng
          </Button>
        </div>
      </AdaptiveSheet>
    );
  }

  return (
    <AdaptiveSheet
      open
      onClose={onClose}
      title="Yêu cầu đặt hàng"
      footer={
        <>
          <Button
            variant="secondary"
            type="button"
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
      {error && (
        <p className="field-error" style={{ marginBottom: '1rem' }}>
          Lỗi: {error}
        </p>
      )}

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
                <div
                  key={field.id}
                  className="p-3 rounded-lg border border-border bg-surface relative"
                >
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="absolute top-2 right-2 p-1 text-muted hover:text-danger rounded-lg bg-background"
                    >
                      <Icon name="X" size={14} />
                    </button>
                  )}

                  <div className="form-grid form-grid-2 mb-3">
                    <div className="form-field">
                      <label>
                        Loại vải <span className="field-required">*</span>
                      </label>
                      <Controller
                        name={`items.${index}.fabric_type` as const}
                        control={control}
                        render={({ field }) => (
                          <Combobox
                            options={fabricOptions.map((f) => ({
                              value: f.name,
                              label: f.name,
                            }))}
                            value={field.value}
                            onChange={(val) => {
                              field.onChange(val);
                              const selected = fabricOptions.find(
                                (f) => f.name === val,
                              );
                              if (selected?.unit) {
                                // Tự động chọn đơn vị nếu có trong danh mục
                                const unitVal =
                                  selected.unit.toLowerCase() === 'mét'
                                    ? 'm'
                                    : selected.unit.toLowerCase();
                                setValue(`items.${index}.unit`, unitVal);
                              }
                            }}
                            placeholder="VD: Cotton 65/35"
                            hasError={!!errors.items?.[index]?.fabric_type}
                            allowInput
                          />
                        )}
                      />
                      {errors.items?.[index]?.fabric_type && (
                        <p className="field-error">
                          {errors.items[index]?.fabric_type?.message}
                        </p>
                      )}
                    </div>
                    <div className="form-field">
                      <label>Tên màu / Mã màu</label>
                      <Controller
                        name={`items.${index}.color_name` as const}
                        control={control}
                        render={({ field }) => (
                          <Combobox
                            options={toColorComboboxOptions(colorOptions)}
                            value={field.value ?? ''}
                            onChange={field.onChange}
                            placeholder="VD: Trắng tinh, Đen, Xanh Navy"
                            allowInput
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="form-grid form-grid-2 mb-3">
                    <div className="form-field">
                      <label>
                        Số lượng <span className="field-required">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        className={`field-input${errors.items?.[index]?.quantity ? ' is-error' : ''}`}
                        {...register(`items.${index}.quantity`, {
                          valueAsNumber: true,
                        })}
                      />
                      {errors.items?.[index]?.quantity && (
                        <p className="field-error">
                          {errors.items[index]?.quantity?.message}
                        </p>
                      )}
                    </div>
                    <div className="form-field">
                      <label>Đơn vị</label>
                      <Controller
                        name={`items.${index}.unit` as const}
                        control={control}
                        render={({ field }) => (
                          <Combobox
                            options={[
                              {
                                value: 'kg',
                                label: 'kg',
                              },
                              {
                                value: 'm',
                                label: 'm',
                              },
                              {
                                value: 'cây',
                                label: 'Cây',
                              },
                            ]}
                            value={field.value}
                            onChange={field.onChange}
                            hasError={!!errors.items?.[index]?.unit}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="form-field mb-0">
                    <label>Ghi chú thêm (Hồ cứng, xẻ, v.v...)</label>
                    <input
                      className="field-input"
                      placeholder="Ghi chú về mặt hàng này..."
                      {...register(`items.${index}.notes`)}
                    />
                  </div>
                </div>
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
