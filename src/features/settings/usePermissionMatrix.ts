import { useMemo, useState } from 'react';

import {
  usePermissions,
  useAllRolesPermissions,
  useUpsertRolePermissions,
} from '@/api/permissions.api';
import {
  CONFIGURABLE_ROLES,
  type Permission,
} from '@/schema/permissions.schema';

function groupByModule(permissions: Permission[]) {
  const groups = new Map<string, Permission[]>();
  for (const p of permissions) {
    const list = groups.get(p.module) ?? [];
    list.push(p);
    groups.set(p.module, list);
  }
  return groups;
}

export function usePermissionMatrix() {
  const {
    data: allPermissions,
    isLoading: loadingPerms,
    error: permsError,
  } = usePermissions();
  const {
    data: allRolesPerms,
    isLoading: loadingRoles,
    error: rolesError,
  } = useAllRolesPermissions();
  const upsertMutation = useUpsertRolePermissions();

  const [localGrants, setLocalGrants] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const [syncedKey, setSyncedKey] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Compute initial grants map
  const initialGrants = useMemo(() => {
    if (!allPermissions || !allRolesPerms) return {};
    const map: Record<string, Record<string, boolean>> = {};
    for (const role of CONFIGURABLE_ROLES) {
      map[role] = {};
      for (const p of allPermissions) {
        map[role][p.key] = false;
      }
      const rpList = allRolesPerms[role] ?? [];
      for (const rp of rpList) {
        map[role][rp.permission_key] = rp.granted;
      }
    }
    return map;
  }, [allPermissions, allRolesPerms]);

  // Sync local changes when initial data changes
  const currentKey = useMemo(() => {
    if (!allPermissions || !allRolesPerms) return '';
    return CONFIGURABLE_ROLES.map(
      (role) => `${role}-${allRolesPerms[role]?.length ?? 0}`,
    ).join('|');
  }, [allPermissions, allRolesPerms]);

  if (
    currentKey &&
    currentKey !== syncedKey &&
    Object.keys(initialGrants).length > 0
  ) {
    setLocalGrants(initialGrants);
    setSyncedKey(currentKey);
  }

  // Count dirty elements
  const dirtyCount = useMemo(() => {
    let count = 0;
    if (!allPermissions) return 0;
    for (const role of CONFIGURABLE_ROLES) {
      for (const p of allPermissions) {
        const cur = localGrants[role]?.[p.key] ?? false;
        const ini = initialGrants[role]?.[p.key] ?? false;
        if (cur !== ini) {
          count++;
        }
      }
    }
    return count;
  }, [localGrants, initialGrants, allPermissions]);

  const handleToggle = (role: string, key: string, checked: boolean) => {
    setLocalGrants((prev) => ({
      ...prev,
      [role]: {
        ...(prev[role] ?? {}),
        [key]: checked,
      },
    }));
  };

  const handleToggleModule = (
    role: string,
    _module: string,
    checked: boolean,
    permsInModule: Permission[],
  ) => {
    setLocalGrants((prev) => {
      const roleGrants = { ...(prev[role] ?? {}) };
      for (const p of permsInModule) {
        roleGrants[p.key] = checked;
      }
      return {
        ...prev,
        [role]: roleGrants,
      };
    });
  };

  const handleToggleRole = (role: string, checked: boolean) => {
    if (!allPermissions) return;
    setLocalGrants((prev) => {
      const roleGrants = { ...(prev[role] ?? {}) };
      for (const p of allPermissions) {
        roleGrants[p.key] = checked;
      }
      return {
        ...prev,
        [role]: roleGrants,
      };
    });
  };

  const handleUndo = () => {
    setLocalGrants(initialGrants);
    setSaveSuccess(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      const rolesToUpdate = CONFIGURABLE_ROLES.filter((role) => {
        return (allPermissions ?? []).some((perm) => {
          const cur = localGrants[role]?.[perm.key] ?? false;
          const ini = initialGrants[role]?.[perm.key] ?? false;
          return cur !== ini;
        });
      });

      if (rolesToUpdate.length === 0) {
        setIsSaving(false);
        return;
      }

      await Promise.all(
        rolesToUpdate.map(async (role) => {
          const changes = (allPermissions ?? []).map((perm) => ({
            key: perm.key,
            granted: localGrants[role]?.[perm.key] ?? false,
          }));
          await upsertMutation.mutateAsync({ role, permissions: changes });
        }),
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setSaveError(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // Check state for columns
  const roleCheckStates = useMemo(() => {
    const states: Record<string, { checked: boolean; indeterminate: boolean }> =
      {};
    if (!allPermissions) return states;
    for (const role of CONFIGURABLE_ROLES) {
      const grants = localGrants[role] ?? {};
      const checkedCount = allPermissions.filter((p) => grants[p.key]).length;
      states[role] = {
        checked:
          checkedCount === allPermissions.length && allPermissions.length > 0,
        indeterminate: checkedCount > 0 && checkedCount < allPermissions.length,
      };
    }
    return states;
  }, [localGrants, allPermissions]);

  // Check state for module rows
  const moduleCheckStates = useMemo(() => {
    const states: Record<
      string,
      Record<string, { checked: boolean; indeterminate: boolean }>
    > = {};
    if (!allPermissions) return states;
    const groups = groupByModule(allPermissions);
    for (const [module, perms] of groups.entries()) {
      states[module] = {};
      for (const role of CONFIGURABLE_ROLES) {
        const grants = localGrants[role] ?? {};
        const checkedCount = perms.filter((p) => grants[p.key]).length;
        states[module][role] = {
          checked: checkedCount === perms.length && perms.length > 0,
          indeterminate: checkedCount > 0 && checkedCount < perms.length,
        };
      }
    }
    return states;
  }, [localGrants, allPermissions]);

  const filteredPermissions = useMemo(() => {
    if (!allPermissions) return [];
    if (!searchQuery.trim()) return allPermissions;
    const query = searchQuery.toLowerCase();
    return allPermissions.filter(
      (p) =>
        p.label.toLowerCase().includes(query) ||
        p.key.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)),
    );
  }, [allPermissions, searchQuery]);

  const filteredGroups = useMemo(() => {
    return groupByModule(filteredPermissions);
  }, [filteredPermissions]);

  const isLoading = loadingPerms || loadingRoles;
  const isError = permsError || rolesError || saveError;
  const errDetail = permsError || rolesError || saveError;

  return {
    allPermissions,
    localGrants,
    searchQuery,
    setSearchQuery,
    isSaving,
    saveSuccess,
    saveError,
    dirtyCount,
    handleToggle,
    handleToggleModule,
    handleToggleRole,
    handleUndo,
    handleSave,
    roleCheckStates,
    moduleCheckStates,
    filteredGroups,
    isLoading,
    isError,
    errDetail,
  };
}
