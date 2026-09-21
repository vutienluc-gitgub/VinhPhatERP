import type { ERPPlugin, PluginLifecycleState } from '@/app/types/plugin';

export type FeaturePlugin = ERPPlugin;

class FeatureRegistryClass {
  private plugins = new Map<string, ERPPlugin>();
  private states = new Map<string, PluginLifecycleState>();

  register(plugin: ERPPlugin) {
    this.plugins.set(plugin.key, plugin);
    this.states.set(plugin.key, 'registered');
  }

  registerAll(plugins: ERPPlugin[]) {
    for (const plugin of plugins) {
      this.register(plugin);
    }
  }

  get(key: string): ERPPlugin | undefined {
    return this.plugins.get(key);
  }

  getAll(): ERPPlugin[] {
    return Array.from(this.plugins.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  getByGroup(group: string): ERPPlugin[] {
    return this.getAll().filter((p) => p.group === group);
  }

  getPrintRoutes() {
    const routes: Array<{ path: string; component: () => Promise<{ default: any }> }> = [];
    for (const p of this.plugins.values()) {
      if (p.printRoutes) {
        routes.push(...p.printRoutes);
      }
    }
    return routes;
  }

  async init(): Promise<void> {
    for (const [key, plugin] of this.plugins.entries()) {
      try {
        this.states.set(key, 'initializing');
        if (plugin.onInit) {
          await plugin.onInit();
        }
        this.states.set(key, 'initialized');
      } catch (err) {
        console.error('Failed to init plugin ' + key + ':', err);
        this.states.set(key, 'failed');
      }
    }
  }
}

export const FeatureRegistry = new FeatureRegistryClass();
