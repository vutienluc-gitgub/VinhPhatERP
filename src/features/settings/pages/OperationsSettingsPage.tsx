import { ProductionSettingsForm } from '@/features/settings/ProductionSettingsForm';
import { ShipmentSettingsForm } from '@/features/settings/ShipmentSettingsForm';
import { NotificationSettingsForm } from '@/features/settings/NotificationSettingsForm';
import { PrintSettingsForm } from '@/features/settings/PrintSettingsForm';

export function OperationsSettingsPage() {
  return (
    <>
      <PrintSettingsForm />
      <ProductionSettingsForm />
      <ShipmentSettingsForm />
      <NotificationSettingsForm />
    </>
  );
}
