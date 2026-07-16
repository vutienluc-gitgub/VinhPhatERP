import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import toast from 'react-hot-toast';

import { useConfirm } from '@/shared/hooks/useConfirm';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { StepperFooter } from '@/shared/components/StepperFooter';
import { useStepper } from '@/shared/hooks/useStepper';
import {
  useColorOptions,
  toColorComboboxOptions,
} from '@/shared/hooks/useColorOptions';
import {
  useCreateYarnCatalog,
  useNextYarnCatalogCode,
  useUpdateYarnCatalog,
} from '@/application/settings';
import {
  yarnCatalogDefaultValues,
  yarnCatalogSchema,
} from '@/schema/yarn-catalog.schema';
import type { YarnCatalogFormValues } from '@/schema/yarn-catalog.schema';
import { getErrorMessage } from '@/shared/utils/error';
import { extractFormErrorMessage } from '@/shared/utils/form';

import { YARN_CATALOG_MESSAGES as MSG } from './yarn-catalog.constants';
import type { YarnCatalog } from './types';
import { StepGeneralInfo } from './components/StepGeneralInfo';
import { StepTechnicalSpecs } from './components/StepTechnicalSpecs';
import { StepAdditionalInfo } from './components/StepAdditionalInfo';
import { StepKnittingEngineering } from './components/StepKnittingEngineering';
import { useYarnNameGenerator } from './hooks/useYarnNameGenerator';

const FORM_MESSAGES = {
  genericError: MSG.ERROR_GENERIC,
  unsavedConfirm: MSG.UNSAVED_WARNING,
};

const STEP_1_FIELDS: (keyof YarnCatalogFormValues)[] = [
  'category',
  'yarn_type',
  'count_ne',
  'spinning_method',
  'denier',
  'filament_count',
  'tensile_strength',
  'twist_type',
  'is_fancy',
  'fancy_details',
  'finish',
  'color_status',
  'color_name',
  'intermingle',
];
const STEP_2_FIELDS: (keyof YarnCatalogFormValues)[] = ['unit', 'status'];

function getStepForField(fieldName: keyof YarnCatalogFormValues): number {
  if (STEP_1_FIELDS.includes(fieldName)) return 1;
  if (STEP_2_FIELDS.includes(fieldName)) return 2;
  return 0; // default to step 0
}

type YarnCatalogFormProps = {
  catalog: YarnCatalog | null;
  onClose: () => void;
};

function catalogToFormValues(catalog: YarnCatalog): YarnCatalogFormValues {
  return {
    code: catalog.code,
    name: catalog.name,
    composition: catalog.composition ?? '',
    color_name: catalog.color_name ?? '',
    tensile_strength: catalog.tensile_strength ?? '',
    origin: catalog.origin ?? '',
    lot_no: catalog.lot_no ?? '',
    grade: catalog.grade ?? '',
    category: catalog.category ?? '',
    yarn_type: catalog.yarn_type ?? '',
    denier: catalog.denier ?? '',
    filament_count: catalog.filament_count ?? '',
    finish: catalog.finish ?? '',
    color_status: catalog.color_status ?? '',
    count_ne: catalog.count_ne ?? '',
    spinning_method: catalog.spinning_method ?? '',
    twist_type: catalog.twist_type ?? '',
    certifications: catalog.certifications ?? [],
    is_fancy: catalog.is_fancy ?? false,
    fancy_details: catalog.fancy_details ?? '',
    unit: catalog.unit,
    notes: catalog.notes ?? '',
    status: catalog.status,
  };
}

export function YarnCatalogForm({ catalog, onClose }: YarnCatalogFormProps) {
  const isEditing = catalog !== null;
  const createMutation = useCreateYarnCatalog();
  const updateMutation = useUpdateYarnCatalog();
  const { data: nextCode } = useNextYarnCatalogCode();
  const { data: colorOptions = [] } = useColorOptions();

  const methods = useForm<YarnCatalogFormValues>({
    resolver: zodResolver(yarnCatalogSchema),
    defaultValues: isEditing
      ? catalogToFormValues(catalog)
      : yarnCatalogDefaultValues,
  });

  const {
    handleSubmit,
    trigger,
    reset,
    setValue,
    formState: { isSubmitting, isDirty },
  } = methods;

  const { confirm, alert } = useConfirm();

  const handleCancel = useCallback(() => {
    if (isDirty) {
      void confirm({
        title: MSG.UNSAVED_TITLE,
        message: FORM_MESSAGES.unsavedConfirm,
        cancelLabel: MSG.BTN_CONTINUE_EDIT,
        confirmLabel: MSG.BTN_CLOSE,
        variant: 'danger',
      }).then((confirmed) => {
        if (confirmed) onClose();
      });
      return false;
    }
    onClose();
    return true;
  }, [isDirty, onClose, confirm]);

  const stepper = useStepper({
    totalSteps: 4,
    stepValidation: {
      0: () => trigger(['code', 'composition', 'origin']),
      1: () =>
        trigger([
          'category',
          'yarn_type',
          'count_ne',
          'spinning_method',
          'denier',
          'filament_count',
          'tensile_strength',
          'twist_type',
          'is_fancy',
          'fancy_details',
          'finish',
          'color_status',
          'color_name',
          'intermingle',
        ]),
      2: () => trigger(['unit', 'status']),
    },
    onCancel: handleCancel,
  });

  useEffect(() => {
    reset(isEditing ? catalogToFormValues(catalog) : yarnCatalogDefaultValues);
  }, [catalog, isEditing, reset]);

  useEffect(() => {
    if (!isEditing && nextCode) {
      setValue('code', nextCode);
    }
  }, [isEditing, nextCode, setValue]);

  const colorComboboxOptions = useMemo(
    () => toColorComboboxOptions(colorOptions),
    [colorOptions],
  );

  // Auto-generate name based on specs (extracted to custom hook)
  useYarnNameGenerator(methods);

  async function onSubmit(values: YarnCatalogFormValues) {
    if (stepper.currentStep !== stepper.totalSteps - 1) {
      void stepper.next();
      return;
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: catalog.id, values });
      } else {
        await createMutation.mutateAsync(values);
      }
      toast.success(
        isEditing ? MSG.MSG_UPDATE_SUCCESS : MSG.MSG_CREATE_SUCCESS,
      );
      onClose();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : FORM_MESSAGES.genericError;
      void alert(MSG.ERROR_PREFIX + msg);
      console.error('[YarnCatalogSubmitError]', err);
    }
  }

  const mutationError = isEditing ? updateMutation.error : createMutation.error;
  const isPending =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <AdaptiveSheet
      open={true}
      onClose={handleCancel}
      title={
        isEditing
          ? `${MSG.FORM_TITLE_EDIT} ${catalog.name}`
          : MSG.FORM_TITLE_NEW
      }
      stepInfo={{
        current: stepper.currentStep,
        total: stepper.totalSteps,
      }}
      maxWidth={720}
    >
      {mutationError && (
        <p className="error-inline mb-4" role="alert">
          {MSG.ERROR_PREFIX} {getErrorMessage(mutationError)}
        </p>
      )}

      <FormProvider {...methods}>
        <form
          id="yarn-catalog-form"
          onSubmit={handleSubmit(onSubmit, (validationErrors) => {
            const errorMessage = extractFormErrorMessage(validationErrors);
            toast.error(errorMessage);

            // Tìm step chứa field bị lỗi đầu tiên
            const firstKey = Object.keys(
              validationErrors,
            )[0] as keyof YarnCatalogFormValues;
            const errorStep = getStepForField(firstKey);

            if (stepper.currentStep !== errorStep) {
              stepper.goTo(errorStep);
            }

            // Scroll to element after step is visible
            setTimeout(() => {
              if (firstKey) {
                const el =
                  document.getElementById(firstKey) ??
                  document.querySelector(`[name="${firstKey}"]`);
                el?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                });
              }
            }, 100);
          })}
          onKeyDown={stepper.handleKeyDown}
          noValidate
        >
          <div className="form-grid">
            <StepGeneralInfo
              hidden={stepper.currentStep !== 0}
              isEditing={isEditing}
            />

            <StepTechnicalSpecs
              hidden={stepper.currentStep !== 1}
              colorComboboxOptions={colorComboboxOptions}
            />

            <StepAdditionalInfo hidden={stepper.currentStep !== 2} />

            <StepKnittingEngineering
              hidden={stepper.currentStep !== 3}
              catalog={catalog}
            />
          </div>

          <StepperFooter
            stepper={stepper}
            onCancel={handleCancel}
            isPending={isPending}
            submitLabel={isEditing ? MSG.BTN_UPDATE : MSG.BTN_CREATE}
          />
        </form>
      </FormProvider>
    </AdaptiveSheet>
  );
}
