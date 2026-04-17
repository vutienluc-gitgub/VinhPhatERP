import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm, useWatch, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import { Button, CancelButton } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
import { CurrencyInput } from '@/shared/components/CurrencyInput';
import { QuickSupplierForm } from '@/shared/components/QuickSupplierForm';
import {
  useColorOptions,
  toColorComboboxOptions,
} from '@/shared/hooks/useColorOptions';
import { formatCurrency } from '@/shared/utils/format';
import {
  useActiveSuppliers,
  useCreateYarnReceipt,
  useUpdateYarnReceipt,
  useYarnCatalogOptions,
} from '@/application/inventory';

import type { YarnReceipt } from './types';
import {
  emptyItem,
  yarnReceiptsDefaultValues,
  yarnReceiptsSchema,
} from './yarn-receipts.module';
import type { YarnReceiptsFormValues } from './yarn-receipts.module';

/* ── Collapsible form section ── */
function FormSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="form-section">
      <div
        className="form-section-header"
        onClick={() => setOpen((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setOpen((v) => !v);
        }}
      >
        <span className="form-section-title">{title}</span>
        <span className="form-section-toggle" data-open={open}>
          ▼
        </span>
      </div>
      {open && <div className="form-section-body">{children}</div>}
    </div>
  );
}

type YarnReceiptFormProps = {
  receipt: YarnReceipt | null;
  onClose: () => void;
};

function receiptToFormValues(receipt: YarnReceipt): YarnReceiptsFormValues {
  return {
    receiptNumber: receipt.receipt_number,
    supplierId: receipt.supplier_id,
    receiptDate: receipt.receipt_date,
    notes: receipt.notes ?? '',
    items: (receipt.yarn_receipt_items ?? []).map((it) => ({
      yarnCatalogId: it.yarn_catalog_id ?? '',
      yarnType: it.yarn_type,
      colorName: it.color_name ?? '',
      quantity: Number(it.quantity),
      unitPrice: Number(it.unit_price),
      lotNumber: it.lot_number ?? '',
      tensileStrength: it.tensile_strength ?? '',
      composition: it.composition ?? '',
      origin: it.origin ?? '',
    })),
  };
}

/* ── Realtime totals sub-component ── */

function LineTotals({
  control,
}: {
  control: ReturnType<typeof useForm<YarnReceiptsFormValues>>['control'];
}) {
  const items = useWatch({
    control,
    name: 'items',
  });
  const total = (items ?? []).reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0,
  );
  return (
    <div className="text-right font-semibold text-base py-2.5 border-t-2 border-[var(--border)]">
      Tổng cộng: {formatCurrency(total)} đ
    </div>
  );
}

export function YarnReceiptForm({ receipt, onClose }: YarnReceiptFormProps) {
  const isEditing = receipt !== null;
  const [showQuickSupplier, setShowQuickSupplier] = useState(false);
  const createMutation = useCreateYarnReceipt();
  const updateMutation = useUpdateYarnReceipt();
  const { data: suppliers = [] } = useActiveSuppliers();
  const { data: yarnCatalogs = [] } = useYarnCatalogOptions();
  const { data: colorOptions = [] } = useColorOptions();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<YarnReceiptsFormValues>({
    resolver: zodResolver(yarnReceiptsSchema),
    defaultValues: isEditing
      ? receiptToFormValues(receipt)
      : yarnReceiptsDefaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  useEffect(() => {
    reset(isEditing ? receiptToFormValues(receipt) : yarnReceiptsDefaultValues);
  }, [receipt, isEditing, reset]);

  async function onSubmit(values: YarnReceiptsFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: receipt.id,
          values,
        });
      } else {
        await createMutation.mutateAsync(values);
      }
      onClose();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'C\u00f3 l\u1ed7i x\u1ea3y ra';
      toast.error(msg);
    }
  }

  const mutationError = isEditing ? updateMutation.error : createMutation.error;
  const isPending =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title={
        isEditing
          ? `Sửa phiếu: ${receipt.receipt_number}`
          : 'Tạo phiếu nhập sợi'
      }
    >
      {mutationError && (
        <p className="error-inline mb-4">
          Lỗi: {(mutationError as Error).message}
        </p>
      )}

      <form
        id="yarn-receipt-form"
        onSubmit={handleSubmit(onSubmit, (validationErrors) => {
          // Build first error message for toast
          const messages: string[] = [];
          for (const val of Object.values(validationErrors)) {
            const msg = val && 'message' in val ? val.message : undefined;
            if (msg) messages.push(String(msg));
            if (messages.length >= 2) break;
          }
          toast.error(
            messages.join('. ') || 'Vui l\u00f2ng ki\u1ec3m tra l\u1ea1i form',
          );
          // Scroll to first error field
          const firstKey = Object.keys(validationErrors)[0];
          if (firstKey) {
            const el =
              document.getElementById(firstKey) ??
              document.querySelector(`[name="${firstKey}"]`);
            el?.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }
        })}
        noValidate
      >
        <div className="form-grid">
          {/* ── Section 1: Thông tin phiếu ── */}
          <FormSection title="Thông tin phiếu" defaultOpen={true}>
            <div className="form-grid">
              <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                <div className="form-field">
                  <label htmlFor="receiptNumber">Số phiếu</label>
                  {isEditing ? (
                    <input
                      id="receiptNumber"
                      className="field-input"
                      type="text"
                      readOnly
                      {...register('receiptNumber')}
                    />
                  ) : (
                    <input
                      id="receiptNumber"
                      className="field-input text-muted italic"
                      type="text"
                      value="Tự động"
                      readOnly
                      disabled
                    />
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="receiptDate">
                    Ngày nhập <span className="field-required">*</span>
                  </label>
                  <input
                    id="receiptDate"
                    className={`field-input${errors.receiptDate ? ' is-error' : ''}`}
                    type="date"
                    {...register('receiptDate')}
                  />
                  {errors.receiptDate && (
                    <span className="field-error">
                      {errors.receiptDate.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="supplierId">
                  Nhà cung cấp <span className="field-required">*</span>
                </label>
                <Controller
                  name="supplierId"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={suppliers.map((s) => ({
                        value: s.id,
                        label: s.name,
                        code: s.code,
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="— Chọn nhà cung cấp —"
                      hasError={!!errors.supplierId}
                    />
                  )}
                />
                {errors.supplierId && (
                  <span className="field-error">
                    {errors.supplierId.message}
                  </span>
                )}
                {!showQuickSupplier && (
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setShowQuickSupplier(true)}
                    className="text-[0.8rem] py-1.5 px-3 self-start mt-2"
                  >
                    {' '}
                    + Tạo NCC mới
                  </Button>
                )}
                {showQuickSupplier && (
                  <div className="mt-2">
                    <QuickSupplierForm
                      defaultCategory="yarn"
                      onCreated={(created) => {
                        setValue('supplierId', created.id);
                        setShowQuickSupplier(false);
                      }}
                      onCancel={() => setShowQuickSupplier(false)}
                    />
                  </div>
                )}
              </div>
            </div>
          </FormSection>

          {/* ── Section 2: Danh sách sợi ── */}
          <FormSection title="Danh sách sợi" defaultOpen={true}>
            {errors.items?.root && (
              <span className="field-error mb-2 block">
                {errors.items.root.message}
              </span>
            )}

            <div className="flex flex-col gap-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="border border-[var(--border)] rounded-[var(--radius-sm)] p-3 relative bg-[var(--surface)]"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[0.85rem] font-semibold text-muted">
                      Dòng {index + 1}
                    </span>
                    {fields.length > 1 && (
                      <button
                        className="btn-icon danger text-[0.85rem]"
                        type="button"
                        title="Xóa dòng"
                        onClick={() => remove(index)}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                    <div className="form-field col-span-full">
                      <label htmlFor={`items.${index}.yarnCatalogId`}>
                        Chọn từ danh mục sợi
                      </label>
                      <Controller
                        name={`items.${index}.yarnCatalogId` as const}
                        control={control}
                        render={({ field }) => (
                          <Combobox
                            options={yarnCatalogs.map((c) => ({
                              value: c.id,
                              label: c.name,
                              code: c.code,
                            }))}
                            value={field.value}
                            onChange={(val) => {
                              field.onChange(val);
                              const cat = yarnCatalogs.find(
                                (c) => c.id === val,
                              );
                              if (cat) {
                                setValue(`items.${index}.yarnType`, cat.name);
                                setValue(
                                  `items.${index}.colorName`,
                                  cat.color_name ?? '',
                                );
                                setValue(
                                  `items.${index}.composition`,
                                  cat.composition ?? '',
                                );
                                setValue(
                                  `items.${index}.tensileStrength`,
                                  cat.tensile_strength ?? '',
                                );
                                setValue(
                                  `items.${index}.origin`,
                                  cat.origin ?? '',
                                );
                              }
                            }}
                            placeholder="— Chọn từ danh mục (tuỳ chọn) —"
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                    <div className="form-field">
                      <label htmlFor={`items.${index}.yarnType`}>
                        Loại sợi <span className="field-required">*</span>
                      </label>
                      <input
                        id={`items.${index}.yarnType`}
                        className={`field-input${errors.items?.[index]?.yarnType ? ' is-error' : ''}`}
                        type="text"
                        placeholder="VD: Cotton 40/1"
                        {...register(`items.${index}.yarnType`)}
                      />
                      {errors.items?.[index]?.yarnType && (
                        <span className="field-error">
                          {errors.items[index].yarnType.message}
                        </span>
                      )}
                    </div>

                    <div className="form-field">
                      <label htmlFor={`items.${index}.colorName`}>
                        Màu sợi
                      </label>
                      <Controller
                        name={`items.${index}.colorName` as const}
                        control={control}
                        render={({ field }) => (
                          <Combobox
                            options={toColorComboboxOptions(colorOptions)}
                            value={field.value ?? ''}
                            onChange={field.onChange}
                            placeholder="Chọn hoặc nhập màu..."
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                    <div className="form-field">
                      <label htmlFor={`items.${index}.quantity`}>
                        Số lượng (kg) <span className="field-required">*</span>
                      </label>
                      <input
                        id={`items.${index}.quantity`}
                        className={`field-input${errors.items?.[index]?.quantity ? ' is-error' : ''}`}
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder="0"
                        {...register(`items.${index}.quantity`, {
                          valueAsNumber: true,
                        })}
                      />
                      {errors.items?.[index]?.quantity && (
                        <span className="field-error">
                          {errors.items[index].quantity.message}
                        </span>
                      )}
                    </div>

                    <div className="form-field">
                      <label htmlFor={`items.${index}.unitPrice`}>
                        Đơn giá <span className="field-required">*</span>
                      </label>
                      <Controller
                        name={`items.${index}.unitPrice` as const}
                        control={control}
                        render={({ field }) => (
                          <CurrencyInput
                            id={`items.${index}.unitPrice`}
                            className={`field-input${errors.items?.[index]?.unitPrice ? ' is-error' : ''}`}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            placeholder="0"
                          />
                        )}
                      />
                      {errors.items?.[index]?.unitPrice && (
                        <span className="field-error">
                          {errors.items[index].unitPrice.message}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                    <div className="form-field">
                      <label htmlFor={`items.${index}.lotNumber`}>
                        Số lô (Lot)
                      </label>
                      <input
                        id={`items.${index}.lotNumber`}
                        className="field-input"
                        type="text"
                        placeholder="VD: LOT-2026-03-A"
                        {...register(`items.${index}.lotNumber`)}
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor={`items.${index}.tensileStrength`}>
                        Cường lực
                      </label>
                      <input
                        id={`items.${index}.tensileStrength`}
                        className="field-input"
                        type="text"
                        placeholder="VD: 18 cN/tex"
                        {...register(`items.${index}.tensileStrength`)}
                      />
                    </div>
                  </div>

                  <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                    <div className="form-field">
                      <label htmlFor={`items.${index}.composition`}>
                        Thành phần
                      </label>
                      <input
                        id={`items.${index}.composition`}
                        className="field-input"
                        type="text"
                        placeholder="VD: 100% Cotton"
                        {...register(`items.${index}.composition`)}
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor={`items.${index}.origin`}>Xuất xứ</label>
                      <input
                        id={`items.${index}.origin`}
                        className="field-input"
                        type="text"
                        placeholder="VD: Việt Nam"
                        {...register(`items.${index}.origin`)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="secondary"
              type="button"
              onClick={() => append({ ...emptyItem })}
              className="mt-2 w-full"
            >
              {' '}
              + Thêm dòng sợi
            </Button>

            <LineTotals control={control} />
          </FormSection>

          {/* ── Section 3: Ghi chú ── */}
          <FormSection title="Ghi chú" defaultOpen={false}>
            <div className="form-grid">
              <div className="form-field">
                <textarea
                  id="notes"
                  className="field-textarea"
                  rows={3}
                  placeholder="Ghi chú về phiếu nhập..."
                  {...register('notes')}
                />
              </div>
            </div>
          </FormSection>
        </div>

        <div className="modal-footer mt-6 p-0 border-none">
          <CancelButton onClick={onClose} disabled={isPending} />
          <button
            className="primary-button btn-standard"
            type="submit"
            disabled={isPending}
          >
            {isPending ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Tạo phiếu'}
          </button>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
