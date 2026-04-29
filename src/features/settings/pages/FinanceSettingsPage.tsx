import { FinanceSettingsForm } from '@/features/settings/FinanceSettingsForm';
import { NumberingSettingsForm } from '@/features/settings/NumberingSettingsForm';

export function FinanceSettingsPage() {
  return (
    <>
      <FinanceSettingsForm />
      <NumberingSettingsForm />
    </>
  );
}
