import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useMemo, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import toast from 'react-hot-toast';

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

import type { YarnCatalog } from './types';
import { StepGeneralInfo } from './components/StepGeneralInfo';
import { StepTechnicalSpecs } from './components/StepTechnicalSpecs';
import { StepAdditionalInfo } from './components/StepAdditionalInfo';

const FORM_MESSAGES = {
  genericError: 'Có lỗi xảy ra',
  unsavedConfirm: 'Bạn có thông tin chưa lưu. Bạn có chắc chắn muốn đóng?',
};

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

  const handleCancel = useCallback(() => {
    if (isDirty) {
      if (!window.confirm(FORM_MESSAGES.unsavedConfirm)) {
        return false;
      }
    }
    onClose();
    return true;
  }, [isDirty, onClose]);

  const stepper = useStepper({
    totalSteps: 3,
    stepValidation: {
      0: () => trigger(['code', 'name', 'composition', 'origin']),
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
        ]),
      2: () => trigger(['unit', 'status']),
    },
    onCancel: handleCancel,
  });

  const stepRef = useRef(0);
  useEffect(() => {
    stepRef.current = stepper.currentStep;
  }, [stepper.currentStep]);

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

  async function onSubmit(values: YarnCatalogFormValues) {
    // Guard bằng ref để tránh stale closure khi stepper vừa next()
    if (stepRef.current !== stepper.totalSteps - 1) return;

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: catalog.id, values });
      } else {
        await createMutation.mutateAsync(values);
      }
      onClose();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : FORM_MESSAGES.genericError;
      toast.error(msg);
    }
  }

  const mutationError = isEditing ? updateMutation.error : createMutation.error;
  const isPending =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <AdaptiveSheet
      open={true}
      onClose={handleCancel}
      title={isEditing ? `Sửa: ${catalog.name}` : 'Thêm loại sợi'}
      stepInfo={{
        current: stepper.currentStep,
        total: stepper.totalSteps,
      }}
      maxWidth={720}
    >
      {mutationError && (
        <p className="error-inline mb-4" role="alert">
          Lỗi: {getErrorMessage(mutationError)}
        </p>
      )}

      <FormProvider {...methods}>
        <form
          id="yarn-catalog-form"
          onSubmit={handleSubmit(onSubmit, (validationErrors) => {
            const errorMessage = extractFormErrorMessage(validationErrors);
            toast.error(errorMessage);
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
          </div>

          <StepperFooter
            stepper={stepper}
            onCancel={handleCancel}
            isPending={isPending}
            submitLabel={isEditing ? 'Cập nhật' : 'Thêm loại sợi'}
          />
        </form>
      </FormProvider>
    </AdaptiveSheet>
  );
}
