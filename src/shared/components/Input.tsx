import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, description, error, className, containerClassName, ...props },
    ref,
  ) => {
    return (
      <div className={`flex flex-col gap-1.5 ${containerClassName || ''}`}>
        {label && (
          <label className="text-xs font-bold text-label uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-3 py-2 rounded-xl border bg-input text-text text-sm transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-input-focus focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? 'border-danger ring-1 ring-danger' : 'border-input-border'
          } ${className || ''}`}
          {...props}
        />
        {description && !error && (
          <span className="text-xs text-muted-foreground mt-0.5 block">
            {description}
          </span>
        )}
        {error && (
          <span className="text-xs font-semibold text-danger mt-0.5 block">
            {error}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
