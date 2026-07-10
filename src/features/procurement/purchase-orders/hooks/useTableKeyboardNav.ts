import type { KeyboardEvent } from 'react';
import type { UseFieldArrayAppend } from 'react-hook-form';

import type { PurchaseOrderFormValues } from '@/domain/purchase-orders';

export function useTableKeyboardNav(
  fieldsLength: number,
  append: UseFieldArrayAppend<PurchaseOrderFormValues, 'items'>,
) {
  const handleKeyDown = (
    e: KeyboardEvent<Element>,
    index: number,
    field: string,
  ) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextId = `input-${field}-${index + 1}`;
      const nextEl = document.getElementById(nextId);
      if (nextEl) {
        nextEl.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index > 0) {
        const prevId = `input-${field}-${index - 1}`;
        const prevEl = document.getElementById(prevId);
        if (prevEl) {
          prevEl.focus();
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'unit_price' && index === fieldsLength - 1) {
        append({ material_id: '', uom: 'kg', ordered_qty: 0, unit_price: 0 });
        setTimeout(() => {
          const nextEl = document.getElementById(
            `input-material_id-${index + 1}`,
          );
          if (nextEl) {
            nextEl.focus();
          }
        }, 50);
      } else if (field === 'unit_price' && index < fieldsLength - 1) {
        const nextEl = document.getElementById(
          `input-material_id-${index + 1}`,
        );
        if (nextEl) {
          nextEl.focus();
        }
      }
    }
  };

  return { handleKeyDown };
}
