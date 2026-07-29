import type { ReactNode } from 'react';

import { Button } from '@/shared/components';
import { STEPPER_LABELS } from '@/shared/constants/ui.constants';

type StepperType = {
  isFirst: boolean;
  isLast: boolean;
  prev: () => void;
  next: () => Promise<boolean>;
};

export type StepperFooterProps = {
  stepper: StepperType;
  onCancel: () => void;
  isPending?: boolean;
  submitLabel?: string;
  submitDisabled?: boolean;
  children?: ReactNode; // For AutoSaveSubscriber or other extra elements
  formId?: string;
};

export function StepperFooter({
  stepper,
  onCancel,
  isPending,
  submitLabel = STEPPER_LABELS.SUBMIT,
  submitDisabled,
  children,
  formId,
}: StepperFooterProps) {
  return (
    <div className="mt-6 pt-4 border-t border-border flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3">
      <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full sm:w-auto">
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
          {!stepper.isFirst && (
            <Button
              variant="secondary"
              type="button"
              onClick={stepper.prev}
              disabled={isPending}
              className="w-full sm:w-auto justify-center"
            >
              {STEPPER_LABELS.BACK}
            </Button>
          )}
          {stepper.isFirst && (
            <Button
              variant="secondary"
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="w-full sm:w-auto justify-center"
            >
              {STEPPER_LABELS.CANCEL}
            </Button>
          )}
        </div>
        {children && <div className="hidden sm:block">{children}</div>}
      </div>

      <div className="w-full sm:w-auto">
        {!stepper.isLast ? (
          <Button
            key="btn-next"
            variant="primary"
            type="button"
            onClick={() => void stepper.next()}
            disabled={isPending}
            className="w-full sm:w-auto justify-center"
          >
            {STEPPER_LABELS.NEXT}
          </Button>
        ) : (
          <Button
            key="btn-submit"
            variant="primary"
            type="submit"
            form={formId}
            disabled={isPending || submitDisabled}
            className="w-full sm:w-auto justify-center"
          >
            {isPending ? STEPPER_LABELS.SUBMITTING : submitLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
