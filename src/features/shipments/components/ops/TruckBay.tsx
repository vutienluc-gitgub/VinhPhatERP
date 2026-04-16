import React from 'react';

import { Icon } from '@/shared/components/Icon';
import { ResourceBay } from '@/shared/components/ops-ui';
import type { TruckSlot } from '@/features/shipments/ops-engine/useFleetCommander';

interface TruckBayProps {
  truck: TruckSlot;
  children: React.ReactNode;
}

/**
 * Wraps the generic ResourceBay with real Truck data.
 */
export function TruckBay({ truck, children }: TruckBayProps) {
  const currentWeight = truck.rolls.reduce(
    (sum, r) => sum + (r.weight_kg ?? 0),
    0,
  );

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
