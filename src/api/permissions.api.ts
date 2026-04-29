import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { untypedDb } from '@/services/supabase/client';
import { getTenantId } from '@/services/supabase/tenant';
import type {
  Permission,
  RolePermission,
  RolePermissionUpdate,
} from '@/schema/permissions.schema';

// ── Query Keys ──

const PERMISSIONS_KEY = ['permissions'] as const;
const ROLE_PERMISSIONS_KEY = (role: string) =>
  ['role-permissions', role] as const;
const USER_PERMISSIONS_KEY = (role: string) =>
  ['user-permissions', role] as const;

// ── Fetch all permission definitions ──

async function fetchPermissions(): Promise<Permission[]> {
  const { data, error } = await untypedDb
    .from('permissions')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Permission[];
}

export function usePermissions() {
  return useQuery({
    queryKey: PERMISSIONS_KEY,
    queryFn: fetchPermissions,
    staleTime: 10 * 60 * 1000,
  });
}

// ── Fetch permissions for a specific role ──

async function fetchRolePermissions(role: string): Promise<RolePermission[]> {
  const tenantId = await getTenantId();
  const { data, error } = await untypedDb.rpc('rpc_get_user_permissions', {
    p_role: role,
    p_tenant_id: tenantId,
  });

  if (error) throw new Error(error.message);
  return (data ?? []) as RolePermission[];
}

export function useRolePermissions(role: string) {
  return useQuery({
    queryKey: ROLE_PERMISSIONS_KEY(role),
    queryFn: () => fetchRolePermissions(role),
    enabled: role.length > 0,
  });
}

// ── Fetch current user's permissions (based on their role) ──

export function useUserPermissions(role: string | undefined) {
  return useQuery({
    queryKey: USER_PERMISSIONS_KEY(role ?? ''),
    queryFn: () => fetchRolePermissions(role ?? ''),
    enabled: !!role,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Upsert permissions for a role ──

async function upsertRolePermissions(
  role: string,
  permissions: RolePermissionUpdate[],
): Promise<void> {
  const tenantId = await getTenantId();
  const { error } = await untypedDb.rpc('rpc_upsert_role_permissions', {
    p_role: role,
    p_tenant_id: tenantId,
    p_permissions: permissions,
  });

  if (error) throw new Error(error.message);
}

export function useUpsertRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      role,
      permissions,
    }: {
      role: string;
      permissions: RolePermissionUpdate[];
    }) => upsertRolePermissions(role, permissions),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ROLE_PERMISSIONS_KEY(variables.role),
      });
      queryClient.invalidateQueries({
        queryKey: USER_PERMISSIONS_KEY(variables.role),
      });
    },
  });
}
