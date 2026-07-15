import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { StepperFooter } from '@/shared/components/StepperFooter';
import { useStepper } from '@/shared/hooks/useStepper';
import DraftBanner from '@/shared/components/DraftBanner';
import {
  useCreateWeavingInvoice,
  useUpdateWeavingInvoice,
} from '@/application/production';
import {
  weavingInvoiceFormSchema,
  weavingInvoiceDefaults,
} from '@/schema/weaving-invoice.schema';
import type { WeavingInvoiceFormValues } from '@/schema/weaving-invoice.schema';
import { generateWeavingRollPrefix } from '@/domain/production';
import { getErrorMessage } from '@/shared/utils/error';

import { WEAVING_INVOICE_MESSAGES as MSG } from './weaving-invoices.constants';
import { WeavingInvoiceFormStep1General } from './components/WeavingInvoiceFormStep1General';
import { WeavingInvoiceFormStep2Rolls } from './components/WeavingInvoiceFormStep2Rolls';
import { AutoSaveSubscriber } from './components/AutoSaveSubscriber';
import { useWeavingInvoiceCalculator } from './hooks/useWeavingInvoiceCalculator';
import { useWeavingInvoiceDraft } from './hooks/useWeavingInvoiceDraft';
import type { WeavingInvoice } from './types';

type Props = {
  invoice?: WeavingInvoice | null;
  onClose: () => void;
};

export function WeavingInvoiceForm({ invoice, onClose }: Props) {
  const isEdit = !!invoice;

  const createMutation = useCreateWeavingInvoice();
  const updateMutation = useUpdateWeavingInvoice();

  const {
    register,
    control,
    handleSubmit,
    trigger,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<WeavingInvoiceFormValues>({
    resolver: zodResolver(weavingInvoiceFormSchema),
    defaultValues: isEdit
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

  const stepper = useStepper({
    totalSteps: 2,
    stepValidation: {
      0: () =>
        trigger([
          'invoice_number',
          'supplier_id',
          'invoice_date',
          'fabric_type',
          'unit_price_per_kg',
        ]),
    },
    onCancel: () => {
      if (isDirty) {
        if (!window.confirm(MSG.UNSAVED_WARNING)) {
          return false;
        }
      }
      onClose();
      return true;
    },
  });

  const handleCancel = useCallback(() => {
    if (isDirty) {
      if (!window.confirm(MSG.UNSAVED_WARNING)) {
        return false;
      }
    }
    onClose();
    return true;
  }, [isDirty, onClose]);

  // ── TARGETED FIELD SUBSCRIPTIONS (avoid full-form re-render) ──
  const watchedRolls = useWatch({ control, name: 'rolls' });
  const watchedUnitPrice = useWatch({ control, name: 'unit_price_per_kg' });
  const watchedInvoiceNumber = useWatch({ control, name: 'invoice_number' });

  // ── BUSINESS LOGIC CALCULATIONS ──
  const { scannedCount, totalKg, totalAmount } = useWeavingInvoiceCalculator(
    watchedRolls || [],
    watchedUnitPrice || 0,
  );

  const {
    showDraftBanner,
    savedDraft,
    handleRestoreDraft,
    handleDiscardDraft,
    clearCurrentDraft,
  } = useWeavingInvoiceDraft(isEdit, reset);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'rolls',
  });

  // ── OPS UI: Active roll index for scanning station ──
  const [activeRollIndex, setActiveRollIndex] = useState(0);

  // ── Import rolls from Excel paste or auto-generate ──
  const handleImportRolls = useCallback(
    (
      imported: { roll_number: string; weight_kg: number; length_m?: number }[],
    ) => {
      // Remove existing empty placeholder rows first
      const emptyIndices = fields
        .map((f, i) => {
          const rn = (f as Record<string, unknown>).roll_number;
          const wk = (f as Record<string, unknown>).weight_kg;
          return !rn && (!wk || wk === 0) ? i : -1;
        })
        .filter((i) => i >= 0)
        .reverse(); // reverse to remove from end first
      for (const idx of emptyIndices) {
        remove(idx);
      }

      for (const r of imported) {
        append({
          roll_number: r.roll_number,
          weight_kg:
            r.weight_kg > 0 ? r.weight_kg : (undefined as unknown as number),
          length_m: r.length_m,
          quality_grade: undefined,
          warehouse_location: '',
          lot_number: '',
          notes: '',
        });
      }
      // Focus on first new roll
      setActiveRollIndex(Math.max(0, fields.length - emptyIndices.length));
    },
    [fields, append, remove],
  );

  async function onSubmit(values: WeavingInvoiceFormValues) {
    if (!stepper.isLast) return;
    try {
      if (isEdit && invoice) {
        await updateMutation.mutateAsync({
          id: invoice.id,
          values,
          expectedUpdatedAt: invoice.updated_at ?? undefined,
        });
      } else {
        await createMutation.mutateAsync(values);
      }
      clearCurrentDraft();
      onClose();
    } catch {
      // mutationError renders the error message in UI automatically
    }
  }

  // Auto Prefix derived from invoice number to ensure global uniqueness and logical grouping
  const autoPrefix = generateWeavingRollPrefix(watchedInvoiceNumber);

  const isPending =
    isSubmitting || createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error ?? updateMutation.error;

  return (
    <AdaptiveSheet
      open
      onClose={handleCancel}
      title={isEdit ? MSG.FORM_EDIT_TITLE : MSG.FORM_CREATE_TITLE}
      stepInfo={{
        current: stepper.currentStep,
        total: stepper.totalSteps,
      }}
      maxWidth={900}
    >
      {/* Auto-save subscriber — isolated re-renders */}
      <AutoSaveSubscriber watch={watch} />

      {mutationError && (
        <p className="error-inline mb-4">{getErrorMessage(mutationError)}</p>
      )}

      {showDraftBanner && savedDraft && (
        <DraftBanner
          onRestore={handleRestoreDraft}
          onDiscard={handleDiscardDraft}
        />
      )}

      <form
        id="weaving-form"
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={stepper.handleKeyDown}
        noValidate
        className="flex flex-col flex-1"
      >
        {/* ── BƯỚC 1: THÔNG TIN PHIẾU ── */}
        <div className={stepper.currentStep === 0 ? 'block' : 'hidden'}>
          <WeavingInvoiceFormStep1General
            isEdit={isEdit}
            control={control}
            register={register}
            errors={errors}
            setValue={setValue}
          />
        </div>

        {/* ── BƯỚC 2: NHẬP CUỘN VẢI (OPS UI) ── */}
        <div className={stepper.currentStep === 1 ? 'block' : 'hidden'}>
          <WeavingInvoiceFormStep2Rolls
            fields={fields}
            register={register}
            control={control}
            errors={errors}
            remove={remove}
            append={append}
            activeRollIndex={activeRollIndex}
            setActiveRollIndex={setActiveRollIndex}
            scannedCount={scannedCount}
            totalKg={totalKg}
            totalAmount={totalAmount}
            autoPrefix={autoPrefix}
            handleImportRolls={handleImportRolls}
          />
        </div>

        <StepperFooter
          stepper={stepper}
          onCancel={handleCancel}
          isPending={isPending}
          submitLabel={isEdit ? MSG.BTN_SUBMIT_UPDATE : MSG.BTN_SUBMIT_CREATE}
        >
          <AutoSaveSubscriber watch={watch} />
        </StepperFooter>
      </form>
    </AdaptiveSheet>
  );
}
