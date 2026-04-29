import { useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { Icon } from '@/shared/components/Icon';
import { TabSwitcher, type TabItem } from '@/shared/components/TabSwitcher';
import { usePreferences } from '@/shared/context/preferences-context';
import { useCompanySettings } from '@/application/settings';

import { CompanySettingsForm } from './CompanySettingsForm';
import { FinanceSettingsForm } from './FinanceSettingsForm';
import { NumberingSettingsForm } from './NumberingSettingsForm';
import { NotificationSettingsForm } from './NotificationSettingsForm';
import { ProductionSettingsForm } from './ProductionSettingsForm';
import { ShipmentSettingsForm } from './ShipmentSettingsForm';
import { UserManagementSettingsForm } from './UserManagementSettingsForm';
import { ReportSettingsForm } from './ReportSettingsForm';
import { IntegrationSettingsForm } from './IntegrationSettingsForm';
import { UiSettingsForm } from './UiSettingsForm';
import { SETTINGS_LABELS, SETTINGS_MESSAGES } from './settings.constants';

type SettingsTab = 'general' | 'finance' | 'operations' | 'system';

const SETTINGS_TABS: TabItem<SettingsTab>[] = [
  { key: 'general', label: SETTINGS_LABELS.TAB_GENERAL },
  { key: 'finance', label: SETTINGS_LABELS.TAB_FINANCE },
  { key: 'operations', label: SETTINGS_LABELS.TAB_OPERATIONS },
  { key: 'system', label: SETTINGS_LABELS.TAB_SYSTEM },
];

function SettingsSkeleton() {
  return (
    <>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={`skeleton-${i}`} className="panel-card card-flush">
          <div className="card-header-area">
            <div className="flex items-center gap-3">
              <div className="skeleton-block w-10 h-10 rounded-xl" />
              <div className="skeleton-block h-5 w-40 rounded" />
            </div>
          </div>
          <div className="p-6 flex flex-col gap-4">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
              <div className="skeleton-block h-[56px] rounded-lg" />
              <div className="skeleton-block h-[56px] rounded-lg" />
            </div>
            <div className="skeleton-block h-[56px] rounded-lg" />
          </div>
        </div>
      ))}
    </>
  );
}

export function SettingsPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const { prefs, setFluidLayout } = usePreferences();
  const { isLoading, error: loadError } = useCompanySettings();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const visibleTabs = isAdmin
    ? SETTINGS_TABS
    : SETTINGS_TABS.filter((t) => t.key === 'general');

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

      {visibleTabs.length > 1 && (
        <div className="mb-6">
          <TabSwitcher
            tabs={visibleTabs}
            active={activeTab}
            onChange={setActiveTab}
            variant="premium"
          />
        </div>
      )}

      <div className="route-content flex flex-col gap-6">
        {isLoading && <SettingsSkeleton />}

        {loadError && !isLoading && (
          <p className="error-inline">
            {SETTINGS_MESSAGES.LOAD_ERROR}{' '}
            {loadError instanceof Error ? loadError.message : String(loadError)}
          </p>
        )}

        {!isLoading && !loadError && (
          <>
            {activeTab === 'general' && (
              <CompanySettingsForm
                isAdmin={isAdmin}
                fluidLayout={prefs.fluid_layout}
                onFluidLayoutChange={setFluidLayout}
              />
            )}

            {activeTab === 'finance' && isAdmin && (
              <>
                <FinanceSettingsForm />
                <NumberingSettingsForm />
              </>
            )}

            {activeTab === 'operations' && isAdmin && (
              <>
                <ProductionSettingsForm />
                <ShipmentSettingsForm />
                <NotificationSettingsForm />
              </>
            )}

            {activeTab === 'system' && isAdmin && (
              <>
                <UserManagementSettingsForm />
                <ReportSettingsForm />
                <IntegrationSettingsForm />
                <UiSettingsForm />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
