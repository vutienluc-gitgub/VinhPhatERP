import { Icon } from '@/shared/components';

export interface StepItem {
  id: string;
  label: string;
  isCompleted: boolean;
  isActive: boolean;
}

export interface StatusStepperProps {
  steps: StepItem[];
  isCancelled?: boolean;
  cancelledMessage?: string;
}

/**
 * Reusable Horizontal Status Stepper for B2B Order Details (PO / RFQ).
 * Uses the existing `portal.css` stepper styles.
 */
export function StatusStepper({
  steps,
  isCancelled = false,
  cancelledMessage,
}: StatusStepperProps) {
  if (isCancelled) {
    return (
      <div className="portal-card p-4">
        <div className="portal-cancelled-notice">
          <Icon name="XCircle" size={18} />
          <span>{cancelledMessage ?? 'Đơn hàng đã bị hủy hoặc từ chối.'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-card p-5">
      <div className="portal-stepper">
        {steps.map((step, idx) => {
          let dotClass = 'portal-stepper-dot';
          let stepClass = 'portal-stepper-step';

          if (step.isCompleted) {
            dotClass += ' portal-stepper-dot--completed';
            stepClass += ' portal-stepper-step--completed';
          } else if (step.isActive) {
            dotClass += ' portal-stepper-dot--active';
            stepClass += ' portal-stepper-step--active';
          }

          return (
            <div key={step.id} className={stepClass}>
              <div className={dotClass}>
                {step.isCompleted ? (
                  <Icon name="Check" size={14} />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span className="portal-stepper-label">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
