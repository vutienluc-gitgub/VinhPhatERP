import { useAuth } from '@/features/auth/AuthProvider';
import { usePreferences } from '@/shared/context/preferences-context';
import { CompanySettingsForm } from '@/features/settings/CompanySettingsForm';

export function GeneralSettingsPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const { prefs, setFluidLayout } = usePreferences();

  return (
    <CompanySettingsForm
      isAdmin={isAdmin}
      fluidLayout={prefs.fluid_layout}
      onFluidLayoutChange={setFluidLayout}
    />
  );
}
