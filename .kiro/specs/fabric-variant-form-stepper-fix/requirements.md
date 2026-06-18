# Requirements Document

## Introduction

This fix addresses a critical bug in the FabricVariantForm where the stepper navigation fails to advance from step 1 to step 2 when editing an existing fabric variant. The form currently gets stuck on step 1 despite successful field validation, preventing users from completing the edit workflow.

## Glossary

- **FabricVariantForm**: Multi-step form component for creating and editing fabric variants
- **Stepper**: Navigation component that manages progression between form steps
- **AutoSave**: Background save functionality that stores draft data to localStorage
- **Step_Validation**: Form validation logic that must pass before advancing to the next step
- **Edit_Mode**: Form state when modifying an existing fabric variant (variant !== null)
- **Create_Mode**: Form state when creating a new fabric variant (variant === null)

## Requirements

### Requirement 1

**User Story:** As a fabric catalog manager, I want to edit fabric variants using a multi-step form, so that I can update variant information efficiently through a structured workflow.

#### Acceptance Criteria

1. WHEN a user clicks the "Tiếp tục" (Continue) button on step 1 in edit mode, THE Stepper SHALL advance to step 2 after successful validation
2. WHEN step 1 validation passes in edit mode, THE Form SHALL proceed to step 2 without interference from autosave mechanisms
3. WHEN a user is in edit mode, THE AutoSave SHALL remain disabled throughout the entire form interaction
4. WHEN a user completes step 1 validation in edit mode, THE Stepper SHALL update its currentStep state to 1
5. WHEN advancing from step 1 to step 2 in edit mode, THE Form SHALL maintain all entered field values

### Requirement 2

**User Story:** As a fabric catalog manager, I want the form stepper to work consistently in both create and edit modes, so that I have a predictable user experience regardless of the operation type.

#### Acceptance Criteria

1. WHEN a user clicks "Tiếp tục" in create mode or edit mode, THE Stepper SHALL advance to step 2 after successful validation
2. WHEN step validation fails in any mode, THE Stepper SHALL remain on the current step and display validation errors
3. WHEN advancing between steps, THE Form SHALL preserve all user-entered data
4. WHEN using the "Quay lại" (Back) button, THE Stepper SHALL return to the previous step in both modes

### Requirement 3

**User Story:** As a fabric catalog manager, I want autosave behavior to be properly isolated from stepper navigation, so that background save operations don't interfere with form progression.

#### Acceptance Criteria

1. WHEN stepper navigation is active, THE AutoSave SHALL function independently of stepper navigation in all modes
2. WHEN in edit mode, THE AutoSave SHALL remain completely disabled
3. WHEN stepper validation occurs, THE AutoSave SHALL not trigger any save operations
4. WHEN step transitions occur, THE AutoSave SHALL not interfere with the transition logic
5. WHEN validation functions execute, THE Form SHALL complete validation without autosave side effects

### Requirement 4

**User Story:** As a fabric catalog manager, I want reliable step validation, so that I can only advance when all required fields are properly filled.

#### Acceptance Criteria

1. WHEN step 1 validation is triggered, THE Validation SHALL check all required fields: color_name, color_hex, actual_width_cm, actual_gsm, shrinkage_rate_warp, shrinkage_rate_weft, base_uom, conversion_rate
2. WHEN all step 1 fields are valid, THE Validation SHALL return true
3. WHEN any step 1 field is invalid, THE Validation SHALL return false and display appropriate error messages
4. WHEN validation completes successfully, THE Stepper SHALL immediately advance to the next step
5. WHEN validation fails, THE Stepper SHALL remain on the current step and focus on the first invalid field
