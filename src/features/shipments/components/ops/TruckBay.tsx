import React from 'react';

import { Icon } from '@/shared/components/Icon';
import { ResourceBay } from '@/shared/components/ops-ui';
import type { TruckSlot } from '@/features/shipments/ops-engine/useFleetCommander';
import { sumBy } from '@/shared/utils/array.util';

interface TruckBayProps {
  truck: TruckSlot;
  children: React.ReactNode;
}

/**
 * Wraps the generic ResourceBay with real Truck data.
 */
export function TruckBay({ truck, children }: TruckBayProps) {
  const currentWeight = sumBy(truck.rolls, (r) => r.weight_kg ?? 0);

  return (
    <ResourceBay
      id={truck.id}
      title={truck.plate}
      subtitle={`Tài xế: ${truck.driver} - Tải trọng: ${currentWeight.toFixed(1)} / ${truck.maxWeightKg} kg`}
      icon={<Icon name="Truck" size={24} />}
      maxSlots={truck.maxSlots}
      usedSlots={truck.rolls.length}
    >
      {children}
    </ResourceBay>
  );
}
