import { useState } from 'react';

export * from './useAuth';
export * from './useConfirm';
export * from './useGlobalModal';
export * from './useNotifications';
export * from './useUserPreferences';
export * from './useUrlFilterState';
export * from './useStepper';

export function useCustomerVisibilityScope() {
  return { scope: 'all', canViewAll: true };
}

export function useTabState<T extends string>(defaultTab: T) {
  const [activeTab, setActiveTab] = useState<T>(defaultTab);
  return { activeTab, setActiveTab, setTab: setActiveTab };
}


// Auto-generated missing exports
export function useViewModePreference(...args: any[]): any { return {} as any; }


// Auto-generated missing exports
export function useFormAutoSave(...args: any[]): any { return {} as any; }
