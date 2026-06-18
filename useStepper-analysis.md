# useStepper Hook Analysis - FabricVariantForm Stepper Bug

## Executive Summary

Analyzed the useStepper hook implementation and its integration in FabricVariantForm component. The bug where clicking "Tiếp tục" (Continue) doesn't advance from step 1 to step 2 in edit mode appears to be caused by timing and state management issues between form validation, stepper state, and potential React re-rendering conflicts.

## Current Implementation Analysis

### 1. useStepper Hook Structure

**Location**: `src/shared/hooks/useStepper.ts`

**Current State Management**:

```typescript
const [currentStep, setCurrentStep] = useState(initialStep);
const currentStepRef = useRef(currentStep);
```

**Next Function Implementation**:

```typescript
const next = useCallback(async () => {
  if (stepValidation && stepValidation[currentStep]) {
    const isValid = await stepValidation[currentStep]();
    if (!isValid) return false;
  }
  setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  return true;
}, [totalSteps, currentStep, stepValidation]);
```

### 2. FabricVariantForm Integration Points

**Location**: `src/features/fabric-catalog/FabricVariantForm.tsx`

**Stepper Configuration**:

```typescript
const stepper = useStepper({
  totalSteps: 2,
  stepValidation: {
    0: async () => {
      return await formMethods.trigger([
        'color_name',
        'color_hex',
        'actual_width_cm',
        'actual_gsm',
        'shrinkage_rate_warp',
        'shrinkage_rate_weft',
        'base_uom',
        'conversion_rate',
      ]);
    },
  },
});
```

**Button Implementation**:

```typescript
<Button
  variant="primary"
  type="button"
  onClick={() => void stepper.next()}
  disabled={isPending}
>
  Tiếp tục
</Button>
```

### 3. AutoSave Integration

**AutoSave Configuration**:

```typescript
const { status, lastSavedTimeText, clearDraft } = useFormAutoSave({
  formId: isEditing
    ? `fabric-variant-edit-${variant.id}`
    : `fabric-variant-create-${parentCode}`,
  methods: formMethods,
  enabled: !isEditing, // Disabled in edit mode
});
```

## Root Cause Analysis

### 1. Primary Issues Identified

**Dependency Array Issue in useStepper**:

- The `next` function includes `currentStep` in its dependency array
- This causes the function to be recreated on every step change
- Could lead to stale closure issues when validation is async

**React State Batching Conflicts**:

- Form validation triggers may cause re-renders
- Stepper state updates might be batched with form updates
- Could result in state synchronization issues

**Missing Transition Guard**:

- No protection against concurrent step transitions
- Multiple rapid clicks could cause race conditions
- No `isTransitioning` state to prevent conflicts

### 2. Edit Mode vs Create Mode Differences

**Edit Mode Specific Issues**:

- Form starts with pre-populated data
- AutoSave is disabled (correct behavior)
- Initial form state might interfere with validation

**Validation Timing**:

- `formMethods.trigger()` is async
- React Hook Form validation may have different timing in edit vs create mode
- Pre-populated values might affect validation behavior

### 3. Form Validation Integration

**Required Fields for Step 1**:
According to requirements, step 1 validation should check:

- `color_name` ✓
- `color_hex` ✓
- `actual_width_cm` ✓
- `actual_gsm` ✓
- `shrinkage_rate_warp` ✓
- `shrinkage_rate_weft` ✓
- `base_uom` ✓
- `conversion_rate` ✓

All fields are included in the current validation trigger.

## Potential Solutions

### 1. Add Transition Guard (High Priority)

Add `isTransitioning` state to prevent concurrent transitions:

```typescript
interface StepperState {
  currentStep: number;
  isTransitioning: boolean;
}
```

### 2. Fix Dependency Array (Medium Priority)

Remove `currentStep` from next function dependencies to prevent stale closures:

```typescript
const next = useCallback(async () => {
  const step = currentStepRef.current; // Use ref instead
  if (stepValidation && stepValidation[step]) {
    const isValid = await stepValidation[step]();
    if (!isValid) return false;
  }
  setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  return true;
}, [totalSteps, stepValidation]);
```

### 3. Add AutoSave Coordination (Low Priority)

Even though autosave is disabled in edit mode, add stepper awareness:

```typescript
interface FormAutoSaveOptions<T> {
  stepperRef?: React.MutableRefObject<{ isTransitioning: boolean }>;
}
```

### 4. Enhanced Error Handling

Add validation result logging and better error handling:

```typescript
const next = useCallback(async () => {
  if (isTransitioning) return false;

  setIsTransitioning(true);
  try {
    if (stepValidation && stepValidation[currentStepRef.current]) {
      const isValid = await stepValidation[currentStepRef.current]();
      if (!isValid) {
        console.warn(
          '[useStepper] Step validation failed for step:',
          currentStepRef.current,
        );
        return false;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
    return true;
  } finally {
    setIsTransitioning(false);
  }
}, [totalSteps, stepValidation]);
```

## Implementation Priority

1. **Phase 1**: Add transition guard to prevent concurrent clicks
2. **Phase 2**: Fix dependency array issues in next function
3. **Phase 3**: Add validation logging for debugging
4. **Phase 4**: Add autosave coordination (if needed)

## Testing Strategy

### Required Test Cases

1. **Edit Mode Step Transition**: Verify step 1 → 2 works in edit mode
2. **Create Mode Step Transition**: Verify step 1 → 2 works in create mode
3. **Validation Failure**: Verify stepper stays on step 1 when validation fails
4. **Rapid Clicking**: Verify concurrent clicks don't cause issues
5. **Form State Preservation**: Verify form data is maintained during transitions

### Specific Fields to Test

For step 1 validation, ensure all required fields trigger proper validation:

- Empty `color_name` should prevent advancement
- Invalid `color_hex` format should prevent advancement
- Invalid numeric values should prevent advancement
- Valid data should allow advancement

## Next Steps

1. Implement transition guard in useStepper hook
2. Fix dependency array issue in next function
3. Add comprehensive logging for debugging
4. Test extensively in both edit and create modes
5. Verify form state preservation during transitions
