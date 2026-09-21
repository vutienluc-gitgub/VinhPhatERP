import React from 'react';
import { Button } from './Button';

export function StepperFooter({ onPrev, onNext, onCancel, currentStep, totalSteps, isSubmitting }: any) {
  return (
    <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
      <Button variant="outline" onClick={onPrev || onCancel}>
        {currentStep === 0 ? 'Hủy bỏ' : 'Quay lại'}
      </Button>
      <Button onClick={onNext} loading={isSubmitting}>
        {currentStep === totalSteps - 1 ? 'Hoàn tất' : 'Tiếp tục'}
      </Button>
    </div>
  );
}
