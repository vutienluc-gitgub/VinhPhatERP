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
  /** Trạng thái đang chuyển bước (để ngăn chặn nhiều lần click đồng thời) */
  isTransitioning: boolean;
  /** Trạng thái đang validate (để theo dõi quá trình validation) */
  isValidating: boolean;
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const currentStepRef = useRef(currentStep);
  const isTransitioningRef = useRef(false);
  const isValidatingRef = useRef(false);

  currentStepRef.current = currentStep;
  isTransitioningRef.current = isTransitioning;
  isValidatingRef.current = isValidating;

  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const next = useCallback(async () => {
    // Transition guard: Prevent concurrent step transitions using ref to avoid closure issues
    if (isTransitioningRef.current || isValidatingRef.current) {
      return false;
    }

    try {
      // Set transitioning flag to prevent rapid clicking
      setIsTransitioning(true);

      // Run step validation if configured
      if (stepValidation && stepValidation[currentStepRef.current]) {
        const validationFn = stepValidation[currentStepRef.current];
        if (validationFn) {
          // Set validating flag to track validation state
          setIsValidating(true);

          try {
            // Ensure validation completes fully before proceeding
            const isValid = await validationFn();

            // Add small delay to ensure all validation side effects complete
            // This prevents timing conflicts with form state updates
            await new Promise((resolve) => setTimeout(resolve, 10));

            if (!isValid) {
              return false;
            }
          } catch (error) {
            // If validation throws an error, treat it as validation failure
            console.error('[useStepper] Step validation error:', error);
            return false;
          } finally {
            // Always reset validation flag
            setIsValidating(false);
          }
        }
      }

      // Advance to next step only after validation fully completes
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
      return true;
    } finally {
      // Always reset transition flag to ensure proper cleanup
      setIsTransitioning(false);
    }
  }, [totalSteps, stepValidation]);

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

    // Cancel any pending cleanup from a previous (StrictMode) unmount
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }

    // Push state giả để chặn browser back
    window.history.pushState({ stepperOpen: true }, '');
    let popped = false;
    let active = true;

    const handlePopState = () => {
      // Guard: ignore events from stale (cleaned-up) effect instances
      if (!active) return;
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
      active = false;
      window.removeEventListener('popstate', handlePopState);
      // Dọn dẹp history nếu form bị unmount không thông qua popstate (VD: bấm nút X)
      // Defer to allow StrictMode remount to cancel this cleanup
      if (!popped && window.history.state?.stepperOpen) {
        const tid = setTimeout(() => {
          if (window.history.state?.stepperOpen) {
            window.history.back();
          }
        }, 50);
        // Store cleanup ID so remount can cancel
        cleanupTimerRef.current = tid;
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
    isTransitioning,
    isValidating,
  };
}
