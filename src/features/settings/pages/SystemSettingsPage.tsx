import { UserManagementSettingsForm } from '@/features/settings/UserManagementSettingsForm';
import { PermissionMatrixForm } from '@/features/settings/PermissionMatrixForm';
import { ReportSettingsForm } from '@/features/settings/ReportSettingsForm';
import { IntegrationSettingsForm } from '@/features/settings/IntegrationSettingsForm';
import { UiSettingsForm } from '@/features/settings/UiSettingsForm';

export function SystemSettingsPage() {
  return (
    <>
      <UserManagementSettingsForm />
      <PermissionMatrixForm />
      <ReportSettingsForm />
      <IntegrationSettingsForm />
      <UiSettingsForm />
    </>
  );
}
