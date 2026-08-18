import type { ERPPlugin, PluginLifecycleState } from '@/app/types/plugin';
import type { UserRole } from '@/shared/types/database.models';
import { logger } from '@/shared/utils/logger';

// ─── Re-exports for backward compat ──────────────────────────────────────────

/**
 * @deprecated Use ERPPlugin from '@/app/types/plugin' instead.
 * Kept for backward compatibility during migration.
 */
export type FeaturePlugin = ERPPlugin;

// ─── Registry ────────────────────────────────────────────────────────────────

/**
 * FeatureRegistry — Level 9 Headless Plugin Orchestrator.
 *
 * Responsibilities (ONLY):
 *   1. Plugin Registration & Lookup
 *   2. Dependency Graph Validation (cycle, missing, self, duplicate)
 *   3. Topological Sort (execution order)
 *   4. Lifecycle State Machine (registered -> initializing -> initialized/failed/blocked)
 *   5. Idempotent init()
 *
 * NOT responsible for: Route generation, Navigation filtering, RBAC evaluation.
 * Those are handled by RouteResolver, NavigationResolver, RBACEvaluator.
 */
class FeatureRegistryClass {
  private plugins = new Map<string, ERPPlugin>();
  private states = new Map<string, PluginLifecycleState>();
  private initErrors = new Map<string, Error>();
  private isInitialized = false;

  // ── Registration ───────────────────────────────────────────────────────────

  /** Register a single plugin. Supports method chaining. */
  register(plugin: ERPPlugin): this {
    if (this.plugins.has(plugin.key)) {
      logger.warn(
        `[FeatureRegistry] Duplicate key "${plugin.key}", overwriting.`,
      );
    }
    this.plugins.set(plugin.key, plugin);
    this.states.set(plugin.key, 'registered');
    return this;
  }

  /** Register multiple plugins. Supports method chaining. */
  registerAll(plugins: ERPPlugin[]): this {
    for (const plugin of plugins) {
      this.register(plugin);
    }
    return this;
  }

  // ── Graph Validation ───────────────────────────────────────────────────────

  /**
   * Validate the dependency graph BEFORE lifecycle initialization.
   *
   * Detects:
   *   - Self-dependency (A depends on A)
   *   - Missing dependency (A depends on X, but X is not registered)
   *   - Circular dependency (A -> B -> C -> A) via DFS cycle detection
   *
   * @throws Error on any graph violation
   */
  validateGraph(): void {
    for (const [key, plugin] of this.plugins) {
      if (!plugin.dependencies) continue;

      for (const dep of plugin.dependencies) {
        // Self-dependency
        if (dep === key) {
          throw new Error(
            `[FeatureRegistry] Self-dependency detected: "${key}" depends on itself.`,
          );
        }
        // Missing dependency
        if (!this.plugins.has(dep)) {
          throw new Error(
            `[FeatureRegistry] Missing dependency: "${key}" depends on "${dep}" which is not registered.`,
          );
        }
      }
    }

    // Circular dependency detection via DFS
    this.detectCycles();
  }

  private detectCycles(): void {
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (key: string, path: string[]): void => {
      if (visited.has(key)) return;
      if (visiting.has(key)) {
        const cycle = [...path.slice(path.indexOf(key)), key].join(' -> ');
        throw new Error(
          `[FeatureRegistry] Circular dependency detected: ${cycle}`,
        );
      }

      visiting.add(key);
      path.push(key);

      const plugin = this.plugins.get(key);
      if (plugin?.dependencies) {
        for (const dep of plugin.dependencies) {
          visit(dep, [...path]);
        }
      }

      visiting.delete(key);
      visited.add(key);
    };

    for (const key of this.plugins.keys()) {
      visit(key, []);
    }
  }

  // ── Topological Sort ───────────────────────────────────────────────────────

  /**
   * Resolve execution order via Kahn's topological sort.
   * Dependencies are initialized before their dependents.
   */
  resolveDependencyOrder(): ERPPlugin[] {
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    // Initialize
    for (const key of this.plugins.keys()) {
      inDegree.set(key, 0);
      adjacency.set(key, []);
    }

    // Build adjacency: dep -> [dependents]
    for (const [key, plugin] of this.plugins) {
      if (plugin.dependencies) {
        for (const dep of plugin.dependencies) {
          adjacency.get(dep)?.push(key);
          inDegree.set(key, (inDegree.get(key) ?? 0) + 1);
        }
      }
    }

    // Kahn's algorithm
    const queue: string[] = [];
    for (const [key, degree] of inDegree) {
      if (degree === 0) queue.push(key);
    }

    const sorted: ERPPlugin[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const plugin = this.plugins.get(current);
      if (plugin) sorted.push(plugin);

      for (const dependent of adjacency.get(current) ?? []) {
        const newDegree = (inDegree.get(dependent) ?? 1) - 1;
        inDegree.set(dependent, newDegree);
        if (newDegree === 0) queue.push(dependent);
      }
    }

    return sorted;
  }

  // ── Lifecycle Orchestration ────────────────────────────────────────────────

  /**
   * Initialize all plugins in dependency order.
   *
   * - Idempotent: calling init() multiple times is safe.
   * - Failure isolation: if plugin X fails, dependents are 'blocked',
   *   independent plugins continue initialization.
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    // Validate graph before running lifecycle
    this.validateGraph();

    const ordered = this.resolveDependencyOrder();
    const failedKeys = new Set<string>();

    for (const plugin of ordered) {
      // Check if any dependency failed/blocked
      const isBlocked = plugin.dependencies?.some((dep) => failedKeys.has(dep));

      if (isBlocked) {
        this.states.set(plugin.key, 'blocked');
        failedKeys.add(plugin.key);
        logger.warn(
          `[FeatureRegistry] Plugin "${plugin.key}" blocked: dependency failed.`,
        );
        continue;
      }

      if (!plugin.onInit) {
        this.states.set(plugin.key, 'initialized');
        continue;
      }

      this.states.set(plugin.key, 'initializing');
      try {
        await plugin.onInit();
        this.states.set(plugin.key, 'initialized');
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        this.states.set(plugin.key, 'failed');
        this.initErrors.set(plugin.key, error);
        failedKeys.add(plugin.key);
        logger.error(
          `[FeatureRegistry] Plugin "${plugin.key}" init failed:`,
          error,
        );
      }
    }

    this.isInitialized = true;
  }

  // ── Lookup / Query ─────────────────────────────────────────────────────────

  /** Get lifecycle state of a plugin */
  getState(key: string): PluginLifecycleState | undefined {
    return this.states.get(key);
  }

  /** Get init error of a failed plugin */
  getError(key: string): Error | undefined {
    return this.initErrors.get(key);
  }

  /** Get a single plugin by key */
  getPlugin(key: string): ERPPlugin | undefined {
    return this.plugins.get(key);
  }

  /** Check if plugin exists */
  has(key: string): boolean {
    return this.plugins.has(key);
  }

  /** Get all plugins sorted by order */
  getAll(): ERPPlugin[] {
    return Array.from(this.plugins.values()).sort(
      (a, b) => (a.order ?? 999) - (b.order ?? 999),
    );
  }

  /** Get all plugins sorted by order (alias for backward compat) */
  getAllPlugins(): ERPPlugin[] {
    return this.getAll();
  }

  // ── Backward Compat Methods ────────────────────────────────────────────────
  // These delegate to the appropriate Resolver layers but exist here
  // temporarily so existing code (routes.tsx, AppShell.tsx) keeps working
  // during migration. They will be removed once Resolvers are fully wired.

  /** @deprecated Use NavigationResolver instead */
  getNavItems(userRole?: UserRole | string): ERPPlugin[] {
    return this.getAll().filter((plugin) => {
      if (!plugin.requiredRoles) return true;
      if (!userRole) return false;
      return (plugin.requiredRoles as string[]).includes(userRole as string);
    });
  }

  /** @deprecated Use RouteResolver instead */
  getAppRoutes(): ERPPlugin[] {
    return this.getAll().filter((p) => !p.requiredRoles);
  }

  /** @deprecated Use RouteResolver instead */
  getRoleRoutes(roles: (UserRole | string)[]): ERPPlugin[] {
    return this.getAll().filter(
      (p) =>
        p.requiredRoles &&
        (p.requiredRoles as string[]).some((r) =>
          (roles as string[]).includes(r),
        ),
    );
  }

  /** @deprecated Use NavigationResolver instead */
  getByGroup(group: ERPPlugin['group']): ERPPlugin[] {
    return this.getAll().filter((p) => p.group === group);
  }

  /** @deprecated Use RouteResolver instead */
  getPrintRoutes(): Array<{
    path: string;
    component: () => Promise<{ default: React.ComponentType }>;
  }> {
    const routes: Array<{
      path: string;
      component: () => Promise<{ default: React.ComponentType }>;
    }> = [];
    for (const plugin of this.getAll()) {
      if (plugin.printRoutes) {
        routes.push(...plugin.printRoutes);
      }
    }
    return routes;
  }

  // ── Testing Utilities ──────────────────────────────────────────────────────

  /** Remove a plugin (used for hot-reload or disabling feature) */
  unregister(key: string): void {
    this.plugins.delete(key);
    this.states.delete(key);
    this.initErrors.delete(key);
  }

  /** Reset entire registry (for testing) */
  clear(): void {
    this.plugins.clear();
    this.states.clear();
    this.initErrors.clear();
    this.isInitialized = false;
  }
}

/** Singleton instance */
export const FeatureRegistry = new FeatureRegistryClass();
