import { useCallback, useState } from 'react';

type StepperOptions = {
  /** Tổng số bước */
  totalSteps: number;
  /** Bước bắt đầu (mặc định = 0) */
  initialStep?: number;
};

type StepperReturn = {
  /** Bước hiện tại (0-indexed) */
  currentStep: number;
  /** Tổng số bước */
  totalSteps: number;
  /** Có phải bước đầu tiên */
  isFirst: boolean;
  /** Có phải bước cuối cùng */
  isLast: boolean;
  /** Chuyển sang bước tiếp theo */
  next: () => void;
  /** Quay lại bước trước */
  prev: () => void;
  /** Nhảy tới bước cụ thể */
  goTo: (step: number) => void;
  /** Reset về bước đầu */
  reset: () => void;
};

/**
 * Hook quản lý trạng thái phân bước (Step-based Form).
 *
 * @example
 * const stepper = useStepper({ totalSteps: 3 })
 * // stepper.currentStep === 0
 * // stepper.isFirst === true
 * // stepper.next() → currentStep = 1
 */
export function useStepper({
  totalSteps,
  initialStep = 0,
}: StepperOptions): StepperReturn {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const next = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const prev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goTo = useCallback(
    (step: number) => {
      if (step >= 0 && step < totalSteps) {
        setCurrentStep(step);
      }
    },
    [totalSteps],
  );

  const reset = useCallback(() => {
    setCurrentStep(initialStep);
  }, [initialStep]);

  return {
    currentStep,
    totalSteps,
    isFirst: currentStep === 0,
    isLast: currentStep === totalSteps - 1,
    next,
    prev,
    goTo,
    reset,
  };
}
