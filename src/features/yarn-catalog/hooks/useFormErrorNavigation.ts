import { useCallback } from 'react';
import toast from 'react-hot-toast';
import type { FieldErrors } from 'react-hook-form';

import { extractFormErrorMessage } from '@/shared/utils/form';
import type { YarnCatalogFormValues } from '@/schema/yarn-catalog.schema';
import type { useStepper } from '@/shared/hooks/useStepper';

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

type UseFormErrorNavigationParams = {
  stepper: ReturnType<typeof useStepper>;
};

export function useFormErrorNavigation({
  stepper,
}: UseFormErrorNavigationParams) {
  const handleValidationErrors = useCallback(
    (validationErrors: FieldErrors<YarnCatalogFormValues>) => {
      const errorMessage = extractFormErrorMessage(validationErrors);
      toast.error(errorMessage);

      // Navigate to step containing first error field
      const firstKey = Object.keys(
        validationErrors,
      )[0] as keyof YarnCatalogFormValues;

      if (firstKey) {
        const errorStep = getStepForField(firstKey);

        if (stepper.currentStep !== errorStep) {
          stepper.goTo(errorStep);
        }

        // Scroll to element after step is visible
        setTimeout(() => {
          const element =
            document.getElementById(firstKey) ??
            document.querySelector(`[name="${firstKey}"]`);
          element?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }, 100);
      }
    },
    [stepper],
  );

  return { handleValidationErrors };
}
