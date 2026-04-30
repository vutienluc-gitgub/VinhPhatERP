import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';

import { Combobox } from '@/shared/components/Combobox';
import { AlertTriangle } from '@/shared/icons';
import {
  useOrderOptions,
  useCustomerOptions,
  useSupplierOptions,
  useGenerateContract,
} from '@/application/contracts';

import { CONTRACT_TYPE_LABELS, CONTRACT_TYPES } from './contracts.module';

const TYPE_OPTIONS = CONTRACT_TYPES.map((t) => ({
  value: t,
  label: CONTRACT_TYPE_LABELS[t],
}));

// ── Form schema ──────────────────────────────────────────────────────────────

const contractFormSchema = z
  .object({
    source_type: z.enum(['order', 'customer', 'supplier']),
    source_id: z.string().min(1, 'Vui lòng chọn nguồn'),
    type: z.enum(CONTRACT_TYPES, {
      required_error: 'Vui lòng chọn loại hợp đồng',
    }),
    effective_date: z.string().optional(),
    expiry_date: z.string().optional(),
    payment_term: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.effective_date && data.expiry_date) {
        return data.expiry_date >= data.effective_date;
      }
      return true;
    },
    {
      message: 'Ngày hết hạn phải sau ngày hiệu lực',
      path: ['expiry_date'],
    },
  );

type ContractFormValues = z.infer<typeof contractFormSchema>;

// ── Props ────────────────────────────────────────────────────────────────────

type ContractFormProps = {
  defaultSourceType?: 'order' | 'customer' | 'supplier';
  defaultSourceId?: string;
  defaultSourceName?: string;
  onSuccess: (contractId: string) => void;
  onCancel: () => void;
};

// ── Source type options ──────────────────────────────────────────────────────

const SOURCE_TYPE_OPTIONS = [
  {
    value: 'order',
    label: 'Đơn hàng',
  },
  {
    value: 'customer',
    label: 'Khách hàng',
  },
  {
    value: 'supplier',
    label: 'Nhà cung cấp',
  },
];

// ── Component ────────────────────────────────────────────────────────────────

export function ContractForm({
  defaultSourceType = 'order',
  defaultSourceId,
  onSuccess,
  onCancel,
}: ContractFormProps) {
  const [warning, setWarning] = useState<string | null>(null);
  const [pendingValues, setPendingValues] = useState<ContractFormValues | null>(
    null,
  );

  const { data: orderOptions = [] } = useOrderOptions();
  const { data: customerOptions = [] } = useCustomerOptions();
  const { data: supplierOptions = [] } = useSupplierOptions();
  const generateMutation = useGenerateContract();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      source_type: defaultSourceType,
      source_id: defaultSourceId ?? '',
      type: defaultSourceType === 'supplier' ? 'purchase' : 'sale',
      effective_date: '',
      expiry_date: '',
      payment_term: '',
      notes: '',
    },
  });

  const sourceType = watch('source_type');

  useEffect(() => {
    setValue('source_id', '');
    setValue('type', sourceType === 'supplier' ? 'purchase' : 'sale');
  }, [sourceType, setValue]);

  function getSourceOptions() {
    if (sourceType === 'order') return orderOptions;
    if (sourceType === 'customer') return customerOptions;
    return supplierOptions;
  }

  async function submitForm(values: ContractFormValues) {
    try {
      const result = await generateMutation.mutateAsync(values);
      if (result.warning) {
        setWarning(result.warning);
        setPendingValues(values);
        return;
      }
      toast.success(`Tạo hợp đồng ${result.contractNumber} thành công`);
      onSuccess(result.contractId);
    } catch (err) {
      toast.error((err as Error).message ?? 'Có lỗi xảy ra');
    }
  }

  async function handleConfirmWarning() {
    if (!pendingValues) return;
    try {
      const result = await generateMutation.mutateAsync(pendingValues);
      toast.success(`Tạo hợp đồng ${result.contractNumber} thành công`);
      setWarning(null);
      setPendingValues(null);
      onSuccess(result.contractId);
    } catch (err) {
      setWarning(null);
      setPendingValues(null);
      toast.error((err as Error).message ?? 'Có lỗi xảy ra');
    }
  }

  return (
    <form id="contract-form" onSubmit={handleSubmit(submitForm)} noValidate>
      {warning && (
        <div className="mb-4 p-3 rounded-lg border border-amber-200 bg-amber-50 flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-amber-800">{warning}</p>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                className="btn-primary text-sm py-1.5 px-3"
                onClick={() => void handleConfirmWarning()}
              >
                Tạo hợp đồng mới
              </button>
              <button
                type="button"
                className="btn-secondary text-sm py-1.5 px-3"
                onClick={() => {
                  setWarning(null);
                  setPendingValues(null);
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="form-grid">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-field">
            <label>
              Nguồn <span className="field-required">*</span>
            </label>
            <Controller
              name="source_type"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={SOURCE_TYPE_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
          <div className="form-field">
            <label>
              {sourceType === 'order'
                ? 'Đơn hàng'
                : sourceType === 'customer'
                  ? 'Khách hàng'
                  : 'Nhà cung cấp'}{' '}
              <span className="field-required">*</span>
            </label>
            <Controller
              name="source_id"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={getSourceOptions()}
                  value={field.value}
                  onChange={field.onChange}
                  hasError={!!errors.source_id}
                />
              )}
            />
            {errors.source_id && (
              <span className="field-error">{errors.source_id.message}</span>
            )}
          </div>
        </div>

        <div className="form-field">
          <label>
            Loại hợp đồng <span className="field-required">*</span>
          </label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Combobox
                options={TYPE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                hasError={!!errors.type}
              />
            )}
          />
          {errors.type && (
            <span className="field-error">{errors.type.message}</span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-field">
            <label>Ngày hiệu lực</label>
            <input
              type="date"
              className={`field-input${errors.effective_date ? ' is-error' : ''}`}
              {...register('effective_date')}
            />
          </div>
          <div className="form-field">
            <label>Ngày hết hạn</label>
            <input
              type="date"
              className={`field-input${errors.expiry_date ? ' is-error' : ''}`}
              {...register('expiry_date')}
            />
            {errors.expiry_date && (
              <span className="field-error">{errors.expiry_date.message}</span>
            )}
          </div>
        </div>

        <div className="form-field">
          <label>Điều khoản thanh toán</label>
          <input
            type="text"
            className="field-input"
            placeholder="VD: Thanh toán 30 ngày sau khi giao hàng"
            {...register('payment_term')}
          />
        </div>

        <div className="form-field">
          <label>Ghi chú</label>
          <textarea
            className="field-textarea"
            rows={3}
            placeholder="Ghi chú thêm..."
            {...register('notes')}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-5 mt-4 border-t border-border">
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Hủy
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={isSubmitting || !!warning}
        >
          {isSubmitting ? 'Đang tạo...' : 'Tạo hợp đồng'}
        </button>
      </div>
    </form>
  );
}
