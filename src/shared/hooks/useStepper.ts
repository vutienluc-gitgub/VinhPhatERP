import { useState } from 'react';
export function useStepper(totalSteps: number) {
  const [currentStep, setCurrentStep] = useState(0);
  return { currentStep, next: () => setCurrentStep(s => Math.min(s + 1, totalSteps - 1)), prev: () => setCurrentStep(s => Math.max(s - 1, 0)), setStep: setCurrentStep };
}
