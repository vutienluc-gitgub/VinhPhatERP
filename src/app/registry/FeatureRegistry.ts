import type { RouteObject } from 'react-router-dom';

import type { ERPPlugin } from '@/app/types/plugin';

class FeatureRegistryClass {
  private plugins = new Map<string, ERPPlugin>();
  private initialized = false;

  register(plugin: ERPPlugin): this {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`[Registry] Plugin "${plugin.id}" đã tồn tại.`);
    }
    this.plugins.set(plugin.id, plugin);
    return this; // hỗ trợ chaining
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    for (const plugin of this.resolveDependencyOrder()) {
      try {
        await plugin.onInit?.();
      } catch (e) {
        console.error(`[Registry] onInit "${plugin.id}" thất bại:`, e);
      }
    }
    this.initialized = true;
  }

  getVisiblePlugins(roles: string[], perms: string[] = []): ERPPlugin[] {
    return [...this.plugins.values()].filter((p) => {
      if (!p.requiredRoles.some((r) => roles.includes(r))) return false;
      if (p.requiredPermissions?.length) {
        return p.requiredPermissions.some((p2) => perms.includes(p2));
      }
      return true;
    });
  }

  getAllRoutes(): RouteObject[] {
    return [...this.plugins.values()].flatMap((p) => p.routes);
  }

  // Topological sort — phát hiện circular dependency
  private resolveDependencyOrder(): ERPPlugin[] {
    const result: ERPPlugin[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (id: string) => {
      if (visited.has(id)) return;
      if (visiting.has(id)) {
        throw new Error(`[Registry] Circular dependency: "${id}"`);
      }
      const p = this.plugins.get(id);
      if (!p) {
        throw new Error(`[Registry] Plugin "${id}" chưa được đăng ký.`);
      }

      visiting.add(id);
      p.dependencies?.forEach(visit);
      visiting.delete(id);

      visited.add(id);
      result.push(p);
    };

    this.plugins.forEach((_, id) => visit(id));
    return result;
  }
}

export const FeatureRegistryV2 = new FeatureRegistryClass();
