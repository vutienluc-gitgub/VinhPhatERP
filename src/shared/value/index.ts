import React from 'react';

export * from './core/formatter';
export * from './core/NumericField';
export * from './percentage/PercentageField';

export function MoneyText({ value, currency = '₫', className = '' }: { value: number | string; currency?: string; className?: string }) {
  const num = Number(value) || 0;
  return React.createElement(
    'span',
    { className: `font-semibold ${className}` },
    `${num.toLocaleString('vi-VN')} ${currency}`
  );
}


// Auto-generated missing exports
export function MoneyInput(props: any): any { return null; }


// Auto-generated missing exports
export function QuantityInput(props: any): any { return null; }


// Auto-generated missing exports
export function NumericInput(props: any): any { return null; }


// Auto-generated missing exports
export function LengthInput(props: any): any { return null; }


// Auto-generated missing exports
export function DensityInput(props: any): any { return null; }
export function WeightInput(props: any): any { return null; }


// Auto-generated missing exports
export function PercentageInput(props: any): any { return null; }


// Auto-generated missing exports
export function WeightField(props: any): any { return null; }
export function QuantityField(props: any): any { return null; }


// Auto-generated missing exports
export function LengthField(props: any): any { return null; }


// Auto-generated missing exports
export function DensityField(props: any): any { return null; }
