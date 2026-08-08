import {
  Controller,
  type FieldValues,
  type Path,
  type Control,
} from 'react-hook-form';

import {
  VPCombobox,
  type VPComboboxOption,
} from '@/shared/components/VPCombobox';

/**
 * ComboboxField — eliminates repetitive Controller + Combobox boilerplate.
 *
 * Wraps react-hook-form Controller around Combobox, providing:
 *   - Type-safe field name binding
 *   - Consistent null-safe value handling
 *   - Optional label rendering
 */
type ComboboxFieldProps<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  options: VPComboboxOption[];
  label?: string;
  placeholder?: string;
  allowInput?: boolean;
  hasError?: boolean;
  disabled?: boolean;
};

export function ComboboxField<T extends FieldValues>({
  name,
  control,
  options,
  label,
  placeholder,
  allowInput,
  hasError,
  disabled,
}: ComboboxFieldProps<T>) {
  return (
    <div className="form-field">
      {label && <label htmlFor={name}>{label}</label>}
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <VPCombobox
            options={options}
            value={(field.value as string) ?? ''}
            onChange={field.onChange}
            allowCreatable={allowInput}
            hasError={hasError}
            disabled={disabled}
            placeholder={placeholder}
          />
        )}
      />
    </div>
  );
}
