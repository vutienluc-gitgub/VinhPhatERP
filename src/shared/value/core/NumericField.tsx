import React from 'react';
import { useController, Control, FieldValues, Path } from 'react-hook-form';

import { cn } from '@/shared/utils/cn';

import { NumericInput, NumericInputProps } from './NumericInput';

export interface NumericFieldProps<
  TFieldValues extends FieldValues,
> extends Omit<NumericInputProps, 'value' | 'onChange' | 'name'> {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  label?: React.ReactNode;
  helpText?: React.ReactNode;
  required?: boolean;
}

export function NumericField<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  helpText,
  required,
  className,
  ...inputProps
}: NumericFieldProps<TFieldValues>) {
  const {
    field: { onChange, value, ref, onBlur },
    fieldState: { error },
  } = useController({
    name,
    control,
  });

  return (
    <div className={cn('form-field', className)}>
      {label && (
        <label htmlFor={name}>
          {label} {required && <span className="field-required">*</span>}
        </label>
      )}
      <NumericInput
        id={name}
        ref={ref}
        name={name}
        value={value as number | null}
        onChange={onChange}
        onBlur={onBlur}
        className={error ? 'is-error' : ''}
        {...inputProps}
      />
      {helpText && !error && (
        <p className="text-xs text-muted mt-1">{helpText}</p>
      )}
      {error && <span className="field-error">{error.message}</span>}
    </div>
  );
}
