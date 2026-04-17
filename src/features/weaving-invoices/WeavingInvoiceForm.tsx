import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useFieldArray, useForm, useWatch, Controller } from 'react-hook-form';

import { useFabricCatalogOptions } from '@/shared/hooks/useFabricCatalogOptions';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
import { CurrencyInput } from '@/shared/components/CurrencyInput';
import { CancelButton, Button } from '@/shared/components';
import { useStepper } from '@/shared/hooks/useStepper';
import { formatCurrency } from '@/shared/utils/format';
import {
  useCreateWeavingInvoice,
  useUpdateWeavingInvoice,
  useNextWeavingInvoiceNumber,
  useWeavingSuppliers,
} from '@/application/production';

import type { WeavingInvoice } from './types';
import {
  weavingInvoiceFormSchema,
  weavingInvoiceDefaults,
  QUALITY_GRADE_LABELS,
  QUALITY_GRADES,
} from './weaving-invoices.module';
import type { WeavingInvoiceFormValues } from './weaving-invoices.module';

type Props = {
  invoice?: WeavingInvoice | null;
  onClose: () => void;
};

export function WeavingInvoiceForm({ invoice, onClose }: Props) {
  const isEdit = !!invoice;
  const stepper = useStepper({ totalSteps: 2 });

  const { data: nextNumber = '' } = useNextWeavingInvoiceNumber();
  const { data: suppliers = [] } = useWeavingSuppliers();
  const { data: fabricOptions = [] } = useFabricCatalogOptions();
  const createMutation = useCreateWeavingInvoice();
  const updateMutation = useUpdateWeavingInvoice();

  const {
    register,
    control,
    handleSubmit,
    trigger,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<WeavingInvoiceFormValues>({
    resolver: zodResolver(weavingInvoiceFormSchema),
    defaultValues: invoice
      ? {
          invoice_number: invoice.invoice_number,
          supplier_id: invoice.supplier_id,
          invoice_date: invoice.invoice_date,
          fabric_type: invoice.fabric_type,
          unit_price_per_kg: invoice.unit_price_per_kg,
          notes: invoice.notes ?? '',
          rolls:
            invoice.weaving_invoice_rolls?.map((r) => ({
              roll_number: r.roll_number,
              weight_kg: r.weight_kg,
              length_m: r.length_m ?? undefined,
              quality_grade: r.quality_grade ?? undefined,
              warehouse_location: r.warehouse_location ?? '',
              lot_number: r.lot_number ?? '',
              notes: r.notes ?? '',
            })) ?? weavingInvoiceDefaults.rolls,
        }
      : weavingInvoiceDefaults,
    mode: 'onTouched',
  });

  // Auto-fill invoice number for new invoices
  useEffect(() => {
    if (!isEdit && nextNumber) setValue('invoice_number', nextNumber);
  }, [nextNumber, isEdit, setValue]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'rolls',
  });
  const watchedRolls = useWatch({
    control,
    name: 'rolls',
  });
  const unitPrice =
    useWatch({
      control,
      name: 'unit_price_per_kg',
    }) ?? 0;

  // Live total calculation
  const totalKg = (watchedRolls ?? []).reduce(
    (sum, r) => sum + (parseFloat(String(r.weight_kg)) || 0),
    0,
  );
  const totalAmount = totalKg * (unitPrice ?? 0);

  async function handleNext() {
    const valid = await trigger([
      'invoice_number',
      'supplier_id',
      'invoice_date',
      'fabric_type',
      'unit_price_per_kg',
    ]);
    if (valid) stepper.next();
  }

  async function onSubmit(values: WeavingInvoiceFormValues) {
    if (!stepper.isLast) return;
    if (isEdit && invoice) {
      await updateMutation.mutateAsync({
        id: invoice.id,
        values,
      });
    } else {
      await createMutation.mutateAsync(values);
    }
    onClose();
  }

  const isPending =
    isSubmitting || createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error ?? updateMutation.error;

  const supplierOptions = suppliers.map((s) => ({
    label: s.name,
    value: s.id,
    code: s.code,
  }));
  const fabricComboOptions = fabricOptions.map((f) => ({
    label: f.name,
    value: f.name,
    code: f.code,
  }));

  return (
    <AdaptiveSheet
      open
      onClose={onClose}
      title={isEdit ? 'Sửa phiếu gia công' : 'Tạo phiếu gia công'}
      stepInfo={{
        current: stepper.currentStep,
        total: stepper.totalSteps,
      }}
      maxWidth={900}
    >
      {mutationError && (
        <p className="error-inline mb-4">{(mutationError as Error).message}</p>
      )}

      <form id="weaving-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* ── BƯỚC 1: THÔNG TIN PHIẾU ── */}
        <div className={stepper.currentStep === 0 ? 'block' : 'hidden'}>
          <fieldset className="bulk-section">
            <legend>Thông tin phiếu gia công</legend>
            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
              {/* Số phiếu */}
              <div className="form-field">
                <label>
                  Số phiếu <span className="field-required">*</span>
                </label>
                <input
                  className={`field-input${errors.invoice_number ? ' is-error' : ''}`}
                  {...register('invoice_number')}
                />
                {errors.invoice_number && (
                  <span className="field-error">
                    {errors.invoice_number.message}
                  </span>
                )}
              </div>

              {/* Nhà dệt */}
              <div className="form-field">
                <label>
                  Nhà dệt <span className="field-required">*</span>
                </label>
                <Controller
                  control={control}
                  name="supplier_id"
                  render={({ field }) => (
                    <Combobox
                      options={supplierOptions}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Chọn nhà dệt..."
                      hasError={!!errors.supplier_id}
                    />
                  )}
                />
                {errors.supplier_id && (
                  <span className="field-error">
                    {errors.supplier_id.message}
                  </span>
                )}
              </div>

              {/* Ngày */}
              <div className="form-field">
                <label>
                  Ngày <span className="field-required">*</span>
                </label>
                <input
                  type="date"
                  className={`field-input${errors.invoice_date ? ' is-error' : ''}`}
                  {...register('invoice_date')}
                />
                {errors.invoice_date && (
                  <span className="field-error">
                    {errors.invoice_date.message}
                  </span>
                )}
              </div>

              {/* Loại vải */}
              <div className="form-field">
                <label>
                  Loại vải <span className="field-required">*</span>
                </label>
                <Controller
                  control={control}
                  name="fabric_type"
                  render={({ field }) => (
                    <Combobox
                      options={fabricComboOptions}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Chọn hoặc nhập loại vải..."
                      hasError={!!errors.fabric_type}
                      allowInput
                    />
                  )}
                />
                {errors.fabric_type && (
                  <span className="field-error">
                    {errors.fabric_type.message}
                  </span>
                )}
              </div>

              {/* Đơn giá */}
              <div className="form-field">
                <label>
                  Đơn giá gia công (đ/kg){' '}
                  <span className="field-required">*</span>
                </label>
                <Controller
                  control={control}
                  name="unit_price_per_kg"
                  render={({ field }) => (
                    <CurrencyInput
                      className={`field-input${errors.unit_price_per_kg ? ' is-error' : ''}`}
                      value={field.value}
                      onChange={(v) => field.onChange(v ?? 0)}
                      onBlur={field.onBlur}
                      placeholder="0"
                    />
                  )}
                />
                {errors.unit_price_per_kg && (
                  <span className="field-error">
                    {errors.unit_price_per_kg.message}
                  </span>
                )}
              </div>

              {/* Ghi chú */}
              <div className="form-field col-span-full">
                <label>Ghi chú</label>
                <textarea
                  className="field-input"
                  rows={2}
                  {...register('notes')}
                />
              </div>
            </div>
          </fieldset>

          <div className="sheet-footer mt-6">
            <CancelButton onClick={onClose} label="Hủy" />
            <button
              type="button"
              className="primary-button btn-standard"
              onClick={handleNext}
            >
              Tiếp theo → Nhập cuộn vải
            </button>
          </div>
        </div>

        {/* ── BƯỚC 2: NHẬP CUỘN VẢI ── */}
        <div className={stepper.currentStep === 1 ? 'block' : 'hidden'}>
          {/* Summary bar */}
          <div className="bulk-summary mb-4 px-4 py-3 bg-[var(--surface-raised)] rounded-[var(--radius)] flex gap-6 flex-wrap text-sm">
            <span>
              Tổng <strong>{fields.length}</strong> cuộn
            </span>
            <span>
              Tổng KG: <strong>{totalKg.toFixed(2)} kg</strong>
            </span>
            <span>
              Thành tiền: <strong>{formatCurrency(totalAmount)} đ</strong>
            </span>
          </div>

          {errors.rolls?.root && (
            <p className="error-inline mb-2">{errors.rolls.root.message}</p>
          )}

          {/* Rolls table */}
          <div className="data-table-wrap overflow-x-auto">
            <table className="data-table min-w-[700px]">
              <thead>
                <tr>
                  <th className="w-[40px]">#</th>
                  <th>Mã cuộn *</th>
                  <th>KG *</th>
                  <th>Dài (m)</th>
                  <th>Loại</th>
                  <th>Vị trí kho</th>
                  <th className="w-[40px]" />
                </tr>
              </thead>
              <tbody>
                {fields.map((field, idx) => (
                  <tr key={field.id}>
                    <td className="text-[var(--text-secondary)]">{idx + 1}</td>
                    <td>
                      <input
                        className={`field-input min-w-[120px]${errors.rolls?.[idx]?.roll_number ? ' is-error' : ''}`}
                        placeholder="VD: VP-001"
                        {...register(`rolls.${idx}.roll_number`)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        className={`field-input w-[90px]${errors.rolls?.[idx]?.weight_kg ? ' is-error' : ''}`}
                        {...register(`rolls.${idx}.weight_kg`)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        className="field-input w-[80px]"
                        {...register(`rolls.${idx}.length_m`)}
                      />
                    </td>
                    <td>
                      <select
                        className="field-select w-[90px]"
                        {...register(`rolls.${idx}.quality_grade`)}
                      >
                        <option value="">—</option>
                        {QUALITY_GRADES.map((g) => (
                          <option key={g} value={g}>
                            {QUALITY_GRADE_LABELS[g]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="field-input w-[100px]"
                        placeholder="A1-R3"
                        {...register(`rolls.${idx}.warehouse_location`)}
                      />
                    </td>
                    <td>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          className="btn-icon danger"
                          onClick={() => remove(idx)}
                          title="Xóa dòng"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex gap-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() =>
                append({
                  roll_number: '',
                  weight_kg: undefined as unknown as number,
                  length_m: undefined,
                  quality_grade: undefined,
                  warehouse_location: '',
                  lot_number: '',
                  notes: '',
                })
              }
            >
              {' '}
              + Thêm cuộn
            </Button>
            {[5, 10].map((n) => (
              <button
                key={n}
                type="button"
                className="btn-secondary"
                onClick={() => {
                  for (let i = 0; i < n; i++) {
                    append({
                      roll_number: '',
                      weight_kg: undefined as unknown as number,
                      length_m: undefined,
                      quality_grade: undefined,
                      warehouse_location: '',
                      lot_number: '',
                      notes: '',
                    });
                  }
                }}
              >
                +{n}
              </button>
            ))}
          </div>

          <div className="sheet-footer mt-6">
            <Button variant="secondary" type="button" onClick={stepper.prev}>
              ← Quay lại
            </Button>
            <button
              type="submit"
              form="weaving-form"
              className="primary-button btn-standard"
              disabled={isPending}
            >
              {isPending
                ? 'Đang lưu...'
                : isEdit
                  ? 'Lưu thay đổi'
                  : 'Lưu phiếu nháp'}
            </button>
          </div>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
