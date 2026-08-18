import { describe, expect, it } from 'vitest';

import { evaluateAccess } from './RBACEvaluator';

describe('RBACEvaluator', () => {
  describe('No constraints configured', () => {
    it('allows any authenticated user when no roles and no permissions are required', () => {
      const allowed = evaluateAccess({}, { role: 'viewer', permissions: [] });
      expect(allowed).toBe(true);
    });

    it('allows access even if user has undefined role/permissions when no constraints required', () => {
      const allowed = evaluateAccess({}, {});
      expect(allowed).toBe(true);
    });
  });

  describe('Role-only constraints', () => {
    it('allows user whose role matches one of requiredRoles', () => {
      const allowed = evaluateAccess(
        { requiredRoles: ['admin', 'manager'] },
        { role: 'manager' },
      );
      expect(allowed).toBe(true);
    });

    it('denies user whose role does not match requiredRoles', () => {
      const allowed = evaluateAccess(
        { requiredRoles: ['admin', 'manager'] },
        { role: 'staff' },
      );
      expect(allowed).toBe(false);
    });

    it('denies user when role is undefined', () => {
      const allowed = evaluateAccess(
        { requiredRoles: ['admin'] },
        { role: undefined },
      );
      expect(allowed).toBe(false);
    });
  });

  describe('Permission-only constraints', () => {
    it('allows user who has at least one matching permission', () => {
      const allowed = evaluateAccess(
        { requiredPermissions: ['customers.write', 'customers.admin'] },
        { permissions: ['customers.read', 'customers.write'] },
      );
      expect(allowed).toBe(true);
    });

    it('denies user who has no matching permissions', () => {
      const allowed = evaluateAccess(
        { requiredPermissions: ['customers.admin'] },
        { permissions: ['customers.read', 'customers.write'] },
      );
      expect(allowed).toBe(false);
    });

    it('denies user when user permissions are undefined or empty', () => {
      expect(
        evaluateAccess(
          { requiredPermissions: ['customers.read'] },
          { permissions: undefined },
        ),
      ).toBe(false);

      expect(
        evaluateAccess(
          { requiredPermissions: ['customers.read'] },
          { permissions: [] },
        ),
      ).toBe(false);
    });
  });

  describe('Combined Role + Permission constraints (AND semantics)', () => {
    it('allows user when BOTH role and permission match', () => {
      const allowed = evaluateAccess(
        {
          requiredRoles: ['manager', 'admin'],
          requiredPermissions: ['orders.approve'],
        },
        {
          role: 'manager',
          permissions: ['orders.approve', 'orders.read'],
        },
      );
      expect(allowed).toBe(true);
    });

    it('denies user when role matches but permission does not', () => {
      const allowed = evaluateAccess(
        {
          requiredRoles: ['manager', 'admin'],
          requiredPermissions: ['orders.approve'],
        },
        {
          role: 'manager',
          permissions: ['orders.read'],
        },
      );
      expect(allowed).toBe(false);
    });

    it('denies user when permission matches but role does not', () => {
      const allowed = evaluateAccess(
        {
          requiredRoles: ['admin'],
          requiredPermissions: ['orders.read'],
        },
        {
          role: 'staff',
          permissions: ['orders.read'],
        },
      );
      expect(allowed).toBe(false);
    });
  });
});
