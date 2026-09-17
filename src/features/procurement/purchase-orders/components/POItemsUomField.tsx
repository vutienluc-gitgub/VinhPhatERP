import type { KeyboardEvent } from 'react';
import { Controller, type Control } from 'react-hook-form';

import type { PurchaseOrderFormValues } from '@/domain/purchase-orders';
import { VPSelect } from '@/shared/components';
import { PO_CONSTANTS } from '@/features/procurement/purchase-orders/purchase-orders.constants';

type POItemsUomFieldProps = {
  control: Control<PurchaseOrderFormValues>;
  index: number;
  onKeyDown: (e: KeyboardEvent<Element>, index: number, field: string) => void;
};

export function POItemsUomField({
  control,
  index,
  onKeyDown,
}: POItemsUomFieldProps) {
  return (
    <Controller
      name={`items.${index}.uom`}
      control={control}
      render={({ field }) => (
        <div onKeyDown={(e) => onKeyDown(e, index, 'uom')}>
          <VPSelect
            id={`input-uom-${index}`}
            size="sm"
            className="w-full font-normal"
            value={field.value}
            onValueChange={field.onChange}
            options={PO_CONSTANTS.UOM_OPTIONS.map((u) => ({
              value: u,
              label: u,
            }))}
          />
        </div>
      )}
    />
  );
}
