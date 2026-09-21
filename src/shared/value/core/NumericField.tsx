import React from 'react';
import { formatNumber } from '@/shared/utils/format';
export function NumericField({ value, unit }: { value: number | string; unit?: string }) {
  return <span>{formatNumber(value)} {unit || ''}</span>;
}
