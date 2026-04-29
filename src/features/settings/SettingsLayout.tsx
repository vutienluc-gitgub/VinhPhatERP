import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthProvider';
import { Icon } from '@/shared/components/Icon';
import { TabSwitcher, type TabItem } from '@/shared/components/TabSwitcher';
import { useCompanySettings } from '@/application/settings';

import { SETTINGS_LABELS, SETTINGS_MESSAGES } from './settings.constants';

type SettingsTab = 'general' | 'finance' | 'operations' | 'system';

const ALL_TABS: (TabItem<SettingsTab> & { adminOnly?: boolean })[] = [
  { key: 'general', label: SETTINGS_LABELS.TAB_GENERAL },
  { key: 'finance', label: SETTINGS_LABELS.TAB_FINANCE, adminOnly: true },
  { key: 'operations', label: SETTINGS_LABELS.TAB_OPERATIONS, adminOnly: true },
  { key: 'system', label: SETTINGS_LABELS.TAB_SYSTEM, adminOnly: true },
];

function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
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
    </div>
  );
}

const TAB_TO_PATH: Record<SettingsTab, string> = {
  general: '/settings/general',
  finance: '/settings/finance',
  operations: '/settings/operations',
  system: '/settings/system',
};

const PATH_TO_TAB: Record<string, SettingsTab> = {
  general: 'general',
  finance: 'finance',
  operations: 'operations',
  system: 'system',
};

export function SettingsLayout() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoading, error: loadError } = useCompanySettings();

  // Extract current tab from URL path
  const pathSegment = location.pathname.split('/').pop() ?? 'general';
  const activeTab: SettingsTab = PATH_TO_TAB[pathSegment] ?? 'general';

  const visibleTabs = isAdmin ? ALL_TABS : ALL_TABS.filter((t) => !t.adminOnly);

  // Redirect non-admin trying to access admin-only tabs
  if (!isAdmin && activeTab !== 'general') {
    return <Navigate to="/settings/general" replace />;
  }

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
            onChange={(key) => navigate(TAB_TO_PATH[key])}
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

        {!isLoading && !loadError && <Outlet />}
      </div>
    </div>
  );
}
