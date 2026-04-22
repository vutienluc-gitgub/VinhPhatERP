import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { fetchNextSupplierCode, createSupplier } from '@/api/suppliers.api';
import {
  SUPPLIER_CATEGORIES,
  SUPPLIER_CATEGORY_LABELS,
  quickSupplierSchema,
  type QuickSupplierValues,
} from '@/schema/supplier.schema';
import { Button } from '@/shared/components/Button';
import { Combobox } from '@/shared/components/Combobox';
import type { ComboboxOption } from '@/shared/components/Combobox';
import { Icon } from '@/shared/components/Icon';

/* ── Static derived data ── */

const CATEGORY_OPTIONS: ComboboxOption[] = SUPPLIER_CATEGORIES.map((c) => ({
  value: c,
  label: SUPPLIER_CATEGORY_LABELS[c],
}));

/* ── Types ── */

type QuickSupplierFormProps = {
  /** Pre-select category, e.g. 'yarn' for yarn receipt, 'weaving' for raw fabric */
  defaultCategory?: (typeof SUPPLIER_CATEGORIES)[number];
  onCreated: (supplier: { id: string; code: string; name: string }) => void;
  onCancel: () => void;
};

/* ── Hooks ── */

function useNextSupplierCode() {
  return useQuery({
    queryKey: ['suppliers', 'next-code'],
    queryFn: fetchNextSupplierCode,
  });
}

function useQuickCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: QuickSupplierValues) => {
      const result = await createSupplier({
        code: values.code,
        name: values.name,
        category: values.category,
        phone: values.phone?.trim() || null,
        status: 'active',
      });
      return {
        id: result.id,
        code: result.code,
        name: result.name,
      };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

/* ── Component ── */

export function QuickSupplierForm({
  defaultCategory = 'other',
  onCreated,
  onCancel,
}: QuickSupplierFormProps) {
  const { data: nextCode } = useNextSupplierCode();
  const createMutation = useQuickCreateSupplier();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<QuickSupplierValues>({
    resolver: zodResolver(quickSupplierSchema),
    defaultValues: {
      code: '',
      name: '',
      category: defaultCategory,
      phone: '',
    },
  });

  useEffect(() => {
    if (nextCode) setValue('code', nextCode);
  }, [nextCode, setValue]);

  async function onSubmit(values: QuickSupplierValues) {
    try {
      const result = await createMutation.mutateAsync(values);
      onCreated(result);
    } catch {
      // error hien thi phia duoi
    }
  }

  const isPending = isSubmitting || createMutation.isPending;

  return (
    <div className="border-[1.5px] border-primary rounded-lg p-3 bg-[rgba(11,107,203,0.03)]">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-bold text-primary">+ Tao NCC nhanh</span>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={onCancel}
          aria-label="Dong"
          className="min-h-[44px] min-w-[44px]"
        >
          <Icon name="x" size={16} />
        </Button>
      </div>

      {/* Error */}
      {createMutation.error && (
        <p className="text-danger text-xs mb-2">
          {(createMutation.error as Error).message}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="flex flex-col gap-3">
          {/* Ma NCC + Danh muc */}
          <div className="grid grid-cols-2 gap-2">
            <div className="form-field">
              <label className="text-xs">Ma NCC</label>
              <input
                className={`field-input${errors.code ? ' is-error' : ''}`}
                type="text"
                readOnly
                {...register('code')}
              />
            </div>
            <div className="form-field">
              <label className="text-xs">Danh muc</label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={CATEGORY_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    hasError={!!errors.category}
                    placeholder="Chọn danh mục..."
                  />
                )}
              />
            </div>
          </div>

          {/* Ten NCC */}
          <div className="form-field">
            <label className="text-xs">
              Ten NCC <span className="field-required">*</span>
            </label>
            <input
              className={`field-input${errors.name ? ' is-error' : ''}`}
              type="text"
              placeholder="VD: Cong ty TNHH ABC"
              autoFocus
              {...register('name')}
            />
            {errors.name && (
              <span className="field-error">{errors.name.message}</span>
            )}
          </div>

          {/* SDT */}
          <div className="form-field">
            <label className="text-xs">SDT</label>
            <input
              className="field-input"
              type="tel"
              placeholder="VD: 0901 234 567"
              {...register('phone')}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={onCancel}
              disabled={isPending}
            >
              Huy
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isPending}
            >
              Tao NCC
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
