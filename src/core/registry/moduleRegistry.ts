import type { RouteObject } from 'react-router-dom';

import type { UserRole } from '@/shared/index';

export type MenuItem = {
  path: string;
  label: string;
  shortLabel: string;
  description?: string;
  icon?: string;
  group?: 'sales' | 'production' | 'master-data' | 'system';
  order?: number;
  requiredRoles?: UserRole[];
  primaryMobile?: boolean;
};

export type AppModule = {
  key: string;
  name: string;
  routes: RouteObject[];
  menu: MenuItem[];
  permissions?: UserRole[];
};

export function createModule(config: AppModule): AppModule {
  return config;
}

class ModuleRegistry {
  private modules = new Map<string, AppModule>();

  registerModule(mod: AppModule) {
    if (this.modules.has(mod.key)) {
      console.warn(`[ModuleRegistry] Module ${mod.key} is already registered.`);
    }
    this.modules.set(mod.key, mod);
  }

  getAllModules(): AppModule[] {
    return Array.from(this.modules.values());
  }

  getAllRoutes(): RouteObject[] {
    return this.getAllModules().flatMap((mod) => mod.routes);
  }

  getAllMenus(): MenuItem[] {
    const menus = this.getAllModules().flatMap((mod) => mod.menu);
    return menus.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }

  bootstrap() {
    // Vite specific: Eagerly load all .module.tsx files across the features directory
    const modules = import.meta.glob('@/features/**/*.module.tsx', {
      eager: true,
    });

    for (const path in modules) {
      const modExport = modules[path] as Record<string, unknown>;

      // Auto-register every exported module definition
      for (const key in modExport) {
        const def = modExport[key];
        if (def && typeof def === 'object' && 'key' in def && 'routes' in def) {
          this.registerModule(def as AppModule);
        }
      }
    }
  }
}

export const moduleRegistry = new ModuleRegistry();
