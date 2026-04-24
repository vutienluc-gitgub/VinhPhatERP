import type { ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';

export type PluginGroup =
  | 'sales'
  | 'production'
  | 'inventory'
  | 'finance'
  | 'hr'
  | 'settings'
  | (string & {});

export interface ERPPlugin {
  id: string;
  name: string;
  icon: string;
  requiredRoles: string[];
  requiredPermissions?: string[]; // granular RBAC
  group: PluginGroup;
  order: number;
  entryPath: string; // link Sidebar
  routes: RouteObject[];
  dependencies?: string[]; // load before this plugin
  onInit?: () => Promise<void>;
  badge?: () => ReactNode;
}
