import {
  Controller,
  type FieldValues,
  type Path,
  type Control,
} from 'react-hook-form';

import { Combobox, type ComboboxOption } from '@/shared/components/Combobox';

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
  options: ComboboxOption[];
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
          <Combobox
            options={options}
            value={(field.value as string) ?? ''}
            onChange={field.onChange}
            allowInput={allowInput}
            placeholder={placeholder}
            hasError={hasError}
            disabled={disabled}
          />
        )}
      />
    </div>
  );
}
