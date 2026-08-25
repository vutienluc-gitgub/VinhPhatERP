import { ProductionSettingsForm } from '@/features/settings/ProductionSettingsForm';
import { ShipmentSettingsForm } from '@/features/settings/ShipmentSettingsForm';
import { NotificationSettingsForm } from '@/features/settings/NotificationSettingsForm';

export function OperationsSettingsPage() {
  return (
    <>
      <ProductionSettingsForm />
      <ShipmentSettingsForm />
      <NotificationSettingsForm />
    </>
  );
}
