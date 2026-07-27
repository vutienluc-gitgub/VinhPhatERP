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
import { CONTRACT_LABELS, CONTRACT_MESSAGES } from './contracts.constants';

const TYPE_OPTIONS = CONTRACT_TYPES.map((t) => ({
  value: t,
  label: CONTRACT_TYPE_LABELS[t],
}));

// ── Form schema ──────────────────────────────────────────────────────────────

const contractFormSchema = z
  .object({
    source_type: z.enum(['order', 'customer', 'supplier']),
    source_id: z.string().min(1, CONTRACT_MESSAGES.ERR_SELECT_SOURCE),
    type: z.enum(CONTRACT_TYPES, {
      required_error: CONTRACT_MESSAGES.ERR_SELECT_TYPE,
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
      message: CONTRACT_MESSAGES.ERR_DATE_RANGE,
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
    label: CONTRACT_LABELS.ORDER,
  },
  {
    value: 'customer',
    label: CONTRACT_LABELS.CUSTOMER,
  },
  {
    value: 'supplier',
    label: CONTRACT_LABELS.SUPPLIER,
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
      toast.success(
        CONTRACT_MESSAGES.TOAST_CREATED_SUCCESS.replace(
          '{number}',
          result.contractNumber,
        ),
      );
      onSuccess(result.contractId);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : (String(err) ?? CONTRACT_MESSAGES.SOMETHING_WENT_WRONG),
      );
    }
  }

  async function handleConfirmWarning() {
    if (!pendingValues) return;
    try {
      const result = await generateMutation.mutateAsync(pendingValues);
      toast.success(
        CONTRACT_MESSAGES.TOAST_CREATED_SUCCESS.replace(
          '{number}',
          result.contractNumber,
        ),
      );
      setWarning(null);
      setPendingValues(null);
      onSuccess(result.contractId);
    } catch (err) {
      setWarning(null);
      setPendingValues(null);
      toast.error(
        err instanceof Error
          ? err.message
          : (String(err) ?? CONTRACT_MESSAGES.SOMETHING_WENT_WRONG),
      );
    }
  }

  return (
    <form id="contract-form" onSubmit={handleSubmit(submitForm)} noValidate>
      {warning && (
        <div className="mb-4 p-3 rounded-lg border border-warning bg-amber-50 flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-warning-strong">{warning}</p>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                className="btn-primary text-sm py-1.5 px-3"
                onClick={() => void handleConfirmWarning()}
              >
                {CONTRACT_LABELS.BTN_CREATE_NEW}
              </button>
              <button
                type="button"
                className="btn-secondary text-sm py-1.5 px-3"
                onClick={() => {
                  setWarning(null);
                  setPendingValues(null);
                }}
              >
                {CONTRACT_LABELS.BTN_CANCEL_ACTION}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="form-grid">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-field">
            <label>
              {CONTRACT_LABELS.SOURCE} <span className="field-required">*</span>
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
                ? CONTRACT_LABELS.ORDER
                : sourceType === 'customer'
                  ? CONTRACT_LABELS.CUSTOMER
                  : CONTRACT_LABELS.SUPPLIER}{' '}
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
            {CONTRACT_LABELS.CONTRACT_TYPE}{' '}
            <span className="field-required">*</span>
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
            <label>{CONTRACT_LABELS.EFFECTIVE_DATE}</label>
            <input
              type="date"
              className={`field-input${errors.effective_date ? ' border-danger' : ''}`}
              {...register('effective_date')}
            />
          </div>
          <div className="form-field">
            <label>{CONTRACT_LABELS.EXPIRY_DATE}</label>
            <input
              type="date"
              className={`field-input${errors.expiry_date ? ' border-danger' : ''}`}
              {...register('expiry_date')}
            />
            {errors.expiry_date && (
              <span className="field-error">{errors.expiry_date.message}</span>
            )}
          </div>
        </div>

        <div className="form-field">
          <label>{CONTRACT_LABELS.PAYMENT_TERM}</label>
          <input
            type="text"
            className="field-input"
            placeholder={CONTRACT_LABELS.PAYMENT_TERM_PLACEHOLDER}
            {...register('payment_term')}
          />
        </div>

        <div className="form-field">
          <label>{CONTRACT_LABELS.NOTES}</label>
          <textarea
            className="field-textarea"
            rows={3}
            placeholder={CONTRACT_LABELS.NOTES_PLACEHOLDER}
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
          {CONTRACT_LABELS.BTN_CANCEL_ACTION}
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={isSubmitting || !!warning}
        >
          {isSubmitting
            ? CONTRACT_LABELS.BTN_CREATING
            : CONTRACT_LABELS.BTN_CREATE}
        </button>
      </div>
    </form>
  );
}
