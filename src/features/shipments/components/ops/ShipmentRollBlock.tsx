import { EntityCard } from '@/shared/components/ops-ui';
import type { OpsGrade } from '@/shared/components/ops-ui';
import type { AvailableRoll } from '@/features/shipments/ShipmentRollPicker';

interface ShipmentRollBlockProps {
  roll: AvailableRoll;
  grade: OpsGrade;
}

/**
 * Wraps the generic EntityCard with real Shipment Roll data.
 * This is the "Smart Skin" that maps business data to dumb UI.
 */
export function ShipmentRollBlock({ roll, grade }: ShipmentRollBlockProps) {
  const weightLabel = roll.weight_kg != null ? `${roll.weight_kg} kg` : 'N/A';
  const isLocked = roll.status === 'reserved';

  return (
    <EntityCard
      id={roll.id}
      grade={grade}
      title={roll.roll_number}
      subtitle={`${weightLabel} · ${roll.fabric_type}`}
      isLocked={isLocked}
    />
  );
}
