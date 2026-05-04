import { useCallback, useState, useEffect, useRef } from 'react';

type StepperOptions = {
  /** Tổng số bước */
  totalSteps: number;
  /** Bước bắt đầu (mặc định = 0) */
  initialStep?: number;
  /**
   * Map kiểm tra hợp lệ trước khi qua bước tiếp theo.
   * Nếu hàm trả về false (hoặc Promise resolve ra false), sẽ không chuyển bước.
   * @example { 0: async () => await trigger(['field1']) }
   */
  stepValidation?: Record<number, () => boolean | Promise<boolean>>;
  /**
   * Tùy chọn: Hàm xử lý đóng form (dùng để chặn PopState/nút Back trên Mobile).
   * Nếu hàm này trả về `false`, sẽ HỦY việc đóng form (ví dụ: User bấm Cancel trong Confirm Dialog).
   */
  onCancel?: () => void | boolean;
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
  /** Chuyển sang bước tiếp theo, trả về true nếu thành công */
  next: () => Promise<boolean>;
  /** Quay lại bước trước */
  prev: () => void;
  /** Nhảy tới bước cụ thể */
  goTo: (step: number) => void;
  /** Reset về bước đầu */
  reset: () => void;
  /** Xử lý phím Enter trên form để tự động next thay vì submit sớm */
  handleKeyDown: (e: React.KeyboardEvent<HTMLFormElement>) => void;
};

/**
 * Hook quản lý trạng thái phân bước (Step-based Form).
 *
 * @example
 * const stepper = useStepper({ totalSteps: 3 })
 * // stepper.currentStep === 0
 * // stepper.isFirst === true
 * // await stepper.next() → currentStep = 1 (nếu validation pass)
 */
export function useStepper({
  totalSteps,
  initialStep = 0,
  stepValidation,
  onCancel,
}: StepperOptions): StepperReturn {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  const next = useCallback(async () => {
    if (stepValidation && stepValidation[currentStep]) {
      const isValid = await stepValidation[currentStep]();
      if (!isValid) return false;
    }
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
    return true;
  }, [totalSteps, currentStep, stepValidation]);

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

  const isLast = currentStep === totalSteps - 1;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLFormElement>) => {
      if (
        e.key === 'Enter' &&
        e.target instanceof HTMLElement &&
        e.target.tagName !== 'TEXTAREA'
      ) {
        if (!isLast) {
          e.preventDefault();
          void next();
        }
      }
    },
    [isLast, next],
  );

  // Xử lý nút Back vật lý trên thiết bị Mobile
  const hasOnCancel = !!onCancel;
  useEffect(() => {
    if (!hasOnCancel) return;

    // Push state giả để chặn browser back
    window.history.pushState({ stepperOpen: true }, '');
    let popped = false;

    const handlePopState = () => {
      popped = true;
      if (currentStepRef.current > 0) {
        // Lùi 1 bước và push lại state để giữ modal
        prev();
        window.history.pushState({ stepperOpen: true }, '');
        popped = false;
      } else {
        // Bước 0: Gọi onCancel. Nếu trả về false thì push lại state để hủy đóng.
        const closed = onCancelRef.current?.();
        if (closed === false) {
          window.history.pushState({ stepperOpen: true }, '');
          popped = false;
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Dọn dẹp history nếu form bị unmount không thông qua popstate (VD: bấm nút X)
      if (!popped && window.history.state?.stepperOpen) {
        window.history.back();
      }
    };
  }, [hasOnCancel, prev]);

  return {
    currentStep,
    totalSteps,
    isFirst: currentStep === 0,
    isLast,
    next,
    prev,
    goTo,
    reset,
    handleKeyDown,
  };
}
