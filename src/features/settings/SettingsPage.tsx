import { useAuth } from '@/features/auth/AuthProvider';
import { Icon } from '@/shared/components/Icon';
import { usePreferences } from '@/shared/context/preferences-context';

import { CompanySettingsForm } from './CompanySettingsForm';
import { SETTINGS_LABELS } from './settings.constants';

export function SettingsPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const { prefs, setFluidLayout } = usePreferences();

  return (
    <div className="page-container pb-20">
      <div className="page-header mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon name="Settings" size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="page-title m-0">{SETTINGS_LABELS.PAGE_TITLE}</h1>
            <p className="page-subtitle m-0">{SETTINGS_LABELS.PAGE_SUBTITLE}</p>
          </div>
        </div>
      </div>

      <div className="route-content flex flex-col gap-6">
        <CompanySettingsForm
          isAdmin={isAdmin}
          fluidLayout={prefs.fluid_layout}
          onFluidLayoutChange={setFluidLayout}
        />
      </div>
    </div>
  );
}
