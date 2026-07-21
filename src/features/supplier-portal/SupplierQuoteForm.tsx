import { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';

import { Button, Icon } from '@/shared/components';
import { MoneyInput } from '@/shared/value';
import type { PublicRfqDetails } from '@/api/supplier-portal.api';

import {
  supplierQuoteSchema,
  SupplierQuoteFormValues,
} from './supplier-portal.schema';
import { SUPPLIER_PORTAL_LABELS } from './supplier-portal.constants';
import { useSubmitSupplierQuote } from './hooks/useSupplierPortal';

interface Props {
  rfq: PublicRfqDetails;
  onSuccess: () => void;
}

export function SupplierQuoteForm({ rfq, onSuccess }: Props) {
  const submitQuoteMutation = useSubmitSupplierQuote();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SupplierQuoteFormValues>({
    resolver: zodResolver(supplierQuoteSchema),
    defaultValues: {
      supplierName: '',
      supplierPhone: '',
      notes: '',
      items: [],
    },
  });

  const { fields } = useFieldArray({
    control,
    name: 'items',
  });

  // Initialize form items based on rfq.items
  useEffect(() => {
    if (rfq.items && rfq.items.length > 0) {
      reset({
        supplierName: '',
        supplierPhone: '',
        notes: '',
        items: rfq.items.map((item) => ({
          rfq_item_id: item.id,
          unit_price: 0,
          qty_offered: item.qty_required,
          notes: '',
        })),
      });
    }
  }, [rfq.items, reset]);

  const onSubmit = async (data: SupplierQuoteFormValues) => {
    try {
      const validItems = data.items.filter((item) => item.unit_price > 0);
      if (validItems.length === 0) {
        toast.error(SUPPLIER_PORTAL_LABELS.ERROR_NO_ITEMS);
        return;
      }

      await submitQuoteMutation.mutateAsync({
        rfq_id: rfq.id,
        supplier_name: data.supplierName,
        supplier_phone: data.supplierPhone,
        notes: data.notes,
        items: validItems.map((item) => ({
          ...item,
          unit_price: Number(item.unit_price),
          qty_offered: Number(item.qty_offered),
        })),
      });
      onSuccess();
    } catch (err) {
      console.error('[SubmitQuoteError]', err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(SUPPLIER_PORTAL_LABELS.ERROR_SUBMIT + ' ' + msg);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Supplier Info */}
      <div className="bg-white rounded-xl shadow-sm border border-border p-5 md:p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted mb-4 border-b border-border pb-2 flex items-center gap-2">
          <Icon name="User" size={16} />
          {SUPPLIER_PORTAL_LABELS.SUPPLIER_INFO}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">
              {SUPPLIER_PORTAL_LABELS.FORM_NAME}{' '}
              <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              className={`field-input w-full ${errors.supplierName ? 'border-destructive focus:ring-destructive/20' : ''}`}
              placeholder={SUPPLIER_PORTAL_LABELS.FORM_NAME_PLACEHOLDER}
              {...register('supplierName')}
            />
            {errors.supplierName && (
              <p className="text-xs text-destructive">
                {errors.supplierName.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">
              {SUPPLIER_PORTAL_LABELS.FORM_PHONE}{' '}
              <span className="text-destructive">*</span>
            </label>
            <input
              type="tel"
              className={`field-input w-full ${errors.supplierPhone ? 'border-destructive focus:ring-destructive/20' : ''}`}
              placeholder={SUPPLIER_PORTAL_LABELS.FORM_PHONE_PLACEHOLDER}
              {...register('supplierPhone')}
            />
            {errors.supplierPhone && (
              <p className="text-xs text-destructive">
                {errors.supplierPhone.message}
              </p>
            )}
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">
              {SUPPLIER_PORTAL_LABELS.FORM_NOTES}
            </label>
            <textarea
              className="field-input w-full min-h-[80px]"
              placeholder={SUPPLIER_PORTAL_LABELS.FORM_NOTES_PLACEHOLDER}
              {...register('notes')}
            />
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="bg-white rounded-xl shadow-sm border border-border p-5 md:p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted mb-4 border-b border-border pb-2 flex items-center gap-2">
          <Icon name="List" size={16} />
          {SUPPLIER_PORTAL_LABELS.ITEMS_INFO}
        </h2>

        <div className="space-y-6">
          {fields.map((field, index) => {
            const originalItem = rfq.items.find(
              (i) => i.id === field.rfq_item_id,
            );
            if (!originalItem) return null;

            return (
              <div
                key={field.id}
                className="border border-slate-200 rounded-lg p-4 bg-slate-50/50"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-slate-800">
                      {index + 1}. {originalItem.material_name}
                    </h3>
                    {originalItem.material_specs && (
                      <p className="text-xs text-muted mt-0.5">
                        {originalItem.material_specs}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted">
                      {SUPPLIER_PORTAL_LABELS.LABEL_REQUIRED}
                    </p>
                    <p className="font-semibold text-primary">
                      {originalItem.qty_required} {originalItem.uom}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      {SUPPLIER_PORTAL_LABELS.COL_PRICE}
                    </label>
                    <div className="relative">
                      <Controller
                        name={`items.${index}.unit_price` as const}
                        control={control}
                        render={({ field }) => (
                          <MoneyInput
                            className="field-input w-full"
                            placeholder={
                              SUPPLIER_PORTAL_LABELS.PLACEHOLDER_PRICE
                            }
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      {SUPPLIER_PORTAL_LABELS.COL_QTY_OFFERED} (
                      {originalItem.uom})
                    </label>
                    <input
                      type="number"
                      className="field-input w-full"
                      placeholder={SUPPLIER_PORTAL_LABELS.PLACEHOLDER_QTY}
                      {...register(`items.${index}.qty_offered` as const)}
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      {SUPPLIER_PORTAL_LABELS.LABEL_ITEM_NOTES_FULL}
                    </label>
                    <input
                      type="text"
                      className="field-input w-full"
                      placeholder={
                        SUPPLIER_PORTAL_LABELS.PLACEHOLDER_ITEM_NOTES
                      }
                      {...register(`items.${index}.notes` as const)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Actions */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full sm:w-auto min-w-[200px]"
          isLoading={isSubmitting || submitQuoteMutation.isPending}
          disabled={isSubmitting || submitQuoteMutation.isPending}
        >
          {isSubmitting || submitQuoteMutation.isPending
            ? SUPPLIER_PORTAL_LABELS.SUBMITTING_BTN
            : SUPPLIER_PORTAL_LABELS.SUBMIT_BTN}
        </Button>
      </div>
    </form>
  );
}
