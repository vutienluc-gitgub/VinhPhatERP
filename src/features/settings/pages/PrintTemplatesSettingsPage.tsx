import { lazy, Suspense } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import {
  type PrintSubTabKey,
  resolvePrintSubTab,
} from '@/features/settings/print-settings-tab.utils';
import { SETTINGS_LABELS } from '@/features/settings/settings.constants';
import { ModuleErrorBoundary } from '@/shared/components/ModuleErrorBoundary';
import { TabSwitcher, type TabItem } from '@/shared/components/TabSwitcher';

// Lazy loading decoupled chunks per Level 9 architecture
const LazyPrintSettingsForm = lazy(() =>
  import('@/features/settings/PrintSettingsForm').then((m) => ({
    default: m.PrintSettingsForm,
  })),
);

const LazyPrintTemplateLibrary = lazy(() =>
  import('@/features/settings/print-templates').then((m) => ({
    default: m.PrintTemplateLibrary,
  })),
);

const SUB_TABS: TabItem<PrintSubTabKey>[] = [
  { key: 'config', label: SETTINGS_LABELS.PRINT_TAB_CONFIG },
  { key: 'templates', label: SETTINGS_LABELS.PRINT_TAB_TEMPLATES },
];

function PrintSectionSkeleton() {
  return (
    <div
      className="flex flex-col gap-6 animate-pulse"
      role="status"
      aria-busy="true"
    >
      <div className="panel-card p-6 flex flex-col gap-4">
        <div className="skeleton-block h-6 w-48 rounded" />
        <div className="skeleton-block h-4 w-72 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div className="skeleton-block h-32 rounded-xl" />
          <div className="skeleton-block h-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function PrintTemplatesSettingsPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Reactive state derived from location + searchParams as single source of truth
  const activeSubTab = resolvePrintSubTab(
    location.pathname,
    searchParams.get('tab'),
  );

  const handleTabChange = (tab: PrintSubTabKey) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-default pb-2">
        <TabSwitcher
          tabs={SUB_TABS}
          active={activeSubTab}
          onChange={handleTabChange}
        />
      </div>

      {activeSubTab === 'config' ? (
        <ModuleErrorBoundary featureName={SETTINGS_LABELS.PRINT_TAB_CONFIG}>
          <Suspense fallback={<PrintSectionSkeleton />}>
            <LazyPrintSettingsForm />
          </Suspense>
        </ModuleErrorBoundary>
      ) : (
        <ModuleErrorBoundary featureName={SETTINGS_LABELS.PRINT_TAB_TEMPLATES}>
          <Suspense fallback={<PrintSectionSkeleton />}>
            <LazyPrintTemplateLibrary />
          </Suspense>
        </ModuleErrorBoundary>
      )}
    </div>
  );
}
