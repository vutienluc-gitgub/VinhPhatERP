import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ERPPlugin } from '@/app/types/plugin';

import { FeatureRegistry } from './FeatureRegistry';

describe('FeatureRegistry Engine', () => {
  beforeEach(() => {
    FeatureRegistry.clear();
  });

  const createPlugin = (
    key: string,
    opts: Partial<ERPPlugin> = {},
  ): ERPPlugin => ({
    key,
    label: `Plugin ${key}`,
    shortLabel: key,
    description: `Description for ${key}`,
    group: 'sales',
    order: 10,
    entryPath: `/${key}`,
    routes: [],
    ...opts,
  });

  describe('Registration & Lookup', () => {
    it('registers plugins and supports chaining', () => {
      FeatureRegistry.register(createPlugin('a')).register(createPlugin('b'));

      expect(FeatureRegistry.has('a')).toBe(true);
      expect(FeatureRegistry.has('b')).toBe(true);
      expect(FeatureRegistry.has('c')).toBe(false);
      expect(FeatureRegistry.getAll()).toHaveLength(2);
    });

    it('retrieves plugin and initial lifecycle state', () => {
      FeatureRegistry.register(createPlugin('test'));

      const plugin = FeatureRegistry.getPlugin('test');
      expect(plugin?.key).toBe('test');
      expect(FeatureRegistry.getState('test')).toBe('registered');
    });

    it('sorts plugins by order property', () => {
      FeatureRegistry.registerAll([
        createPlugin('c', { order: 30 }),
        createPlugin('a', { order: 10 }),
        createPlugin('b', { order: 20 }),
      ]);

      const keys = FeatureRegistry.getAll().map((p) => p.key);
      expect(keys).toEqual(['a', 'b', 'c']);
    });
  });

  describe('Dependency Graph Validation', () => {
    it('throws error when plugin depends on itself', () => {
      FeatureRegistry.register(
        createPlugin('self-dep', { dependencies: ['self-dep'] }),
      );

      expect(() => FeatureRegistry.validateGraph()).toThrow(
        /Self-dependency detected: "self-dep" depends on itself/,
      );
    });

    it('throws error when dependent plugin is missing', () => {
      FeatureRegistry.register(
        createPlugin('feature-a', { dependencies: ['missing-dep'] }),
      );

      expect(() => FeatureRegistry.validateGraph()).toThrow(
        /Missing dependency: "feature-a" depends on "missing-dep"/,
      );
    });

    it('detects 2-node circular dependency (A -> B -> A)', () => {
      FeatureRegistry.registerAll([
        createPlugin('a', { dependencies: ['b'] }),
        createPlugin('b', { dependencies: ['a'] }),
      ]);

      expect(() => FeatureRegistry.validateGraph()).toThrow(
        /Circular dependency detected: a -> b -> a/,
      );
    });

    it('detects multi-node circular dependency (A -> B -> C -> A)', () => {
      FeatureRegistry.registerAll([
        createPlugin('a', { dependencies: ['b'] }),
        createPlugin('b', { dependencies: ['c'] }),
        createPlugin('c', { dependencies: ['a'] }),
      ]);

      expect(() => FeatureRegistry.validateGraph()).toThrow(
        /Circular dependency detected: a -> b -> c -> a/,
      );
    });
  });

  describe('Topological Sort & Dependency Order', () => {
    it('orders plugins so dependencies come before dependents', () => {
      // customers (independent) <- orders (depends on customers) <- work-orders (depends on orders)
      FeatureRegistry.registerAll([
        createPlugin('work-orders', { dependencies: ['orders'] }),
        createPlugin('orders', { dependencies: ['customers'] }),
        createPlugin('customers'),
      ]);

      const ordered = FeatureRegistry.resolveDependencyOrder();
      const keys = ordered.map((p) => p.key);

      expect(keys.indexOf('customers')).toBeLessThan(keys.indexOf('orders'));
      expect(keys.indexOf('orders')).toBeLessThan(keys.indexOf('work-orders'));
    });
  });

  describe('Lifecycle State Machine & Execution', () => {
    it('initializes all plugins successfully and transitions to initialized', async () => {
      const initA = vi.fn().mockResolvedValue(undefined);
      const initB = vi.fn().mockResolvedValue(undefined);

      FeatureRegistry.registerAll([
        createPlugin('a', { onInit: initA }),
        createPlugin('b', { dependencies: ['a'], onInit: initB }),
      ]);

      await FeatureRegistry.init();

      expect(initA).toHaveBeenCalledTimes(1);
      expect(initB).toHaveBeenCalledTimes(1);
      expect(FeatureRegistry.getState('a')).toBe('initialized');
      expect(FeatureRegistry.getState('b')).toBe('initialized');
    });

    it('is idempotent: calling init() multiple times only runs onInit once', async () => {
      const initA = vi.fn().mockResolvedValue(undefined);
      FeatureRegistry.register(createPlugin('a', { onInit: initA }));

      await FeatureRegistry.init();
      await FeatureRegistry.init();

      expect(initA).toHaveBeenCalledTimes(1);
      expect(FeatureRegistry.getState('a')).toBe('initialized');
    });

    it('isolates failure: if B fails, dependent A is blocked, independent C succeeds', async () => {
      const errorB = new Error('Database connection timeout in Module B');
      const initB = vi.fn().mockRejectedValue(errorB);
      const initA = vi.fn().mockResolvedValue(undefined);
      const initC = vi.fn().mockResolvedValue(undefined);

      FeatureRegistry.registerAll([
        createPlugin('b', { onInit: initB }),
        createPlugin('a', { dependencies: ['b'], onInit: initA }),
        createPlugin('c', { onInit: initC }),
      ]);

      await FeatureRegistry.init();

      // B failed
      expect(FeatureRegistry.getState('b')).toBe('failed');
      expect(FeatureRegistry.getError('b')).toBe(errorB);

      // A is blocked because B failed, its onInit is never called
      expect(FeatureRegistry.getState('a')).toBe('blocked');
      expect(initA).not.toHaveBeenCalled();

      // C is independent and initializes cleanly
      expect(FeatureRegistry.getState('c')).toBe('initialized');
      expect(initC).toHaveBeenCalledTimes(1);
    });
  });
});
