# Design Document

## Overview

The FabricVariantForm stepper bug occurs because of timing and state management issues between the stepper navigation and form validation systems. The root cause appears to be in how the `next()` function in the stepper interacts with react-hook-form's validation trigger mechanism, potentially causing the component to re-render or state to reset before the step transition completes.

This design focuses on isolating the stepper state management from form validation side effects and ensuring that step transitions complete atomically without interference from autosave or other reactive systems.

## Architecture

The fix involves three main components working together:

1. **Stepper State Management**: Enhanced `useStepper` hook with improved state isolation
2. **Validation Coordination**: Modified validation flow that prevents state conflicts
3. **Form State Protection**: Improved separation between autosave and stepper concerns

## Components and Interfaces

### Enhanced Stepper Hook

The `useStepper` hook needs modifications to ensure atomic step transitions:

```typescript
interface StepperReturn {
  currentStep: number;
  totalSteps: number;
  isFirst: boolean;
  isLast: boolean;
  next: () => Promise<boolean>;
  prev: () => void;
  goTo: (step: number) => void;
  reset: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLFormElement>) => void;
  isTransitioning: boolean; // NEW: Prevents concurrent transitions
}
```

### Validation Interface

Step validation functions need to be isolated from form state changes:

```typescript
interface StepValidationConfig {
  [stepIndex: number]: () => boolean | Promise<boolean>;
}
```

### Form Auto-Save Coordination

The autosave system needs explicit awareness of stepper transitions:

```typescript
interface FormAutoSaveOptions<T> {
  formId: string;
  methods: UseFormReturn<T>;
  delay?: number;
  enabled?: boolean;
  stepperRef?: React.MutableRefObject<{ isTransitioning: boolean }>; // NEW
}
```

## Data Models

### Stepper State Model

```typescript
interface StepperState {
  currentStep: number;
  isTransitioning: boolean;
  lastValidationResult: boolean | null;
}
```

### Form Validation State

```typescript
interface ValidationState {
  isValidating: boolean;
  lastValidatedStep: number;
  validationErrors: Record<string, string[]>;
}
```

## Error Handling

### Stepper Transition Failures

1. **Validation Failure**: Form validation fails, stepper remains on current step
2. **Concurrent Transition**: Multiple rapid clicks are prevented by transition guard
3. **State Corruption**: React state batching ensures atomic updates

### Form State Recovery

1. **Validation Retry**: Users can retry step advancement after fixing validation errors
2. **State Reset**: Form state can be reset if corruption is detected
3. **Graceful Degradation**: Fall back to single-step form if stepper fails

## Testing Strategy

This bugfix requires focused testing on state management and timing issues:

### Unit Testing Strategy

**Form Validation Tests**:

- Test step 1 validation with all required fields
- Test validation failure scenarios
- Test validation timing and completion

**Stepper Navigation Tests**:

- Test step advancement in create mode
- Test step advancement in edit mode
- Test back navigation in both modes
- Test concurrent click prevention

**State Management Tests**:

- Test form state preservation during step transitions
- Test stepper state isolation from form changes
- Test autosave disabled state in edit mode

**Integration Testing Strategy**:

- Test complete step 1 to step 2 flow in edit mode
- Test form submission after successful step navigation
- Test user interaction patterns with real timing

### Edge Case Testing

**Race Condition Tests**:

- Rapid clicking of continue button
- Validation completing during step transition
- Form state changes during navigation

**Browser Compatibility Tests**:

- Test in different browsers for timing variations
- Test with slow form validation
- Test with network delays

## Implementation Plan

### Phase 1: State Isolation

1. Add transition guard to `useStepper`
2. Prevent concurrent step transitions
3. Isolate step state from form validation

### Phase 2: Validation Coordination

1. Ensure validation completes before step advancement
2. Add validation state tracking
3. Prevent form state changes during validation

### Phase 3: Auto-Save Protection

1. Add stepper awareness to `useFormAutoSave`
2. Prevent autosave during step transitions
3. Verify edit mode autosave remains disabled

### Phase 4: Testing and Validation

1. Test step advancement in both modes
2. Verify form state preservation
3. Confirm bug resolution in production scenarios
