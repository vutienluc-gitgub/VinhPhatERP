import { useEffect, useMemo, useState } from 'react';

import { Icon } from '@/shared/components/Icon';
import { TabSwitcher, type TabItem } from '@/shared/components/TabSwitcher';
import { Switch } from '@/shared/components/Switch';
import { Button } from '@/shared/components/Button';
import { PanelIcon } from '@/features/settings/PanelIcon';
import {
  usePermissions,
  useRolePermissions,
  useUpsertRolePermissions,
} from '@/api/permissions.api';
import {
  PERMISSION_MODULE_LABELS,
  PERMISSION_MODULE_ICONS,
  ROLE_LABELS,
  CONFIGURABLE_ROLES,
  type Permission,
} from '@/schema/permissions.schema';

const ROLE_TABS: TabItem<string>[] = CONFIGURABLE_ROLES.map((r) => ({
  key: r,
  label: ROLE_LABELS[r] ?? r,
}));

const MESSAGES = {
  TITLE: 'Phân quyền chi tiết',
  SUBTITLE: 'Cấu hình quyền truy cập cho từng vai trò',
  ADMIN_NOTE: 'Admin luôn có toàn quyền và không thể chỉnh sửa.',
  SAVE_SUCCESS: 'Đã lưu phân quyền thành công!',
  SAVE_ERROR: 'Lỗi khi lưu:',
  BTN_SAVE: 'Lưu thay đổi',
  BTN_SAVING: 'Đang lưu...',
  BTN_UNDO: 'Hoàn tác',
  LOADING: 'Đang tải...',
  EMPTY: 'Chưa có quyền nào được cấu hình.',
} as const;

function groupByModule(permissions: Permission[]) {
  const groups = new Map<string, Permission[]>();
  for (const p of permissions) {
    const list = groups.get(p.module) ?? [];
    list.push(p);
    groups.set(p.module, list);
  }
  return groups;
}

type ConfigurableRole = (typeof CONFIGURABLE_ROLES)[number];

export function PermissionMatrixForm() {
  const { data: allPermissions, isLoading: loadingPerms } = usePermissions();
  const [activeRole, setActiveRole] = useState<ConfigurableRole>('manager');
  const { data: rolePerms, isLoading: loadingRole } =
    useRolePermissions(activeRole);
  const mutation = useUpsertRolePermissions();

  // Local state: permission_key → granted
  const [localGrants, setLocalGrants] = useState<Record<string, boolean>>({});
  const [initialGrants, setInitialGrants] = useState<Record<string, boolean>>(
    {},
  );

  // Sync server data → local state when role changes
  useEffect(() => {
    if (rolePerms && allPermissions) {
      const map: Record<string, boolean> = {};
      // Default all to false
      for (const p of allPermissions) {
        map[p.key] = false;
      }
      // Apply server grants
      for (const rp of rolePerms) {
        map[rp.permission_key] = rp.granted;
      }
      setLocalGrants(map);
      setInitialGrants(map);
    }
  }, [rolePerms, allPermissions]);

  const isDirty = useMemo(() => {
    return Object.keys(localGrants).some(
      (k) => localGrants[k] !== initialGrants[k],
    );
  }, [localGrants, initialGrants]);

  const handleToggle = (key: string, granted: boolean) => {
    setLocalGrants((prev) => ({ ...prev, [key]: granted }));
  };

  const handleSave = async () => {
    const changes = Object.entries(localGrants).map(([key, granted]) => ({
      key,
      granted,
    }));
    await mutation.mutateAsync({ role: activeRole, permissions: changes });
  };

  const handleUndo = () => {
    setLocalGrants({ ...initialGrants });
  };

  const isLoading = loadingPerms || loadingRole;
  const permGroups = allPermissions ? groupByModule(allPermissions) : null;

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <div className="flex items-center gap-3">
          <PanelIcon name="ShieldCheck" color="indigo" />
          <div>
            <span className="font-bold text-lg block">{MESSAGES.TITLE}</span>
            <span className="text-xs text-muted">{MESSAGES.SUBTITLE}</span>
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Admin note */}
        <div className="info-box flex items-center gap-2 text-sm">
          <Icon
            name="Info"
            size={14}
            strokeWidth={2}
            className="text-muted shrink-0"
          />
          <span>{MESSAGES.ADMIN_NOTE}</span>
        </div>

        {/* Role tabs */}
        <TabSwitcher
          tabs={ROLE_TABS}
          active={activeRole}
          onChange={(key) => setActiveRole(key as ConfigurableRole)}
          variant="premium"
        />

        {/* Feedback */}
        {mutation.isSuccess && (
          <div className="success-inline">
            <Icon name="CheckCircle2" size={16} strokeWidth={2} />
            {MESSAGES.SAVE_SUCCESS}
          </div>
        )}

        {mutation.error && (
          <p className="error-inline">
            {MESSAGES.SAVE_ERROR}{' '}
            {mutation.error instanceof Error
              ? mutation.error.message
              : String(mutation.error)}
          </p>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={`perm-skel-${i}`}
                className="skeleton-block h-[48px] rounded-lg"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!allPermissions || allPermissions.length === 0) && (
          <p className="text-sm text-muted text-center py-8">
            {MESSAGES.EMPTY}
          </p>
        )}

        {/* Permission groups */}
        {!isLoading && permGroups && (
          <div className="flex flex-col gap-4">
            {Array.from(permGroups.entries()).map(([module, perms]) => (
              <div
                key={module}
                className="border border-border rounded-lg overflow-hidden"
              >
                {/* Module header */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-surface">
                  <Icon
                    name={PERMISSION_MODULE_ICONS[module] ?? 'Layers'}
                    size={16}
                    strokeWidth={1.5}
                    className="text-muted"
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted">
                    {PERMISSION_MODULE_LABELS[module] ?? module}
                  </span>
                </div>

                {/* Permission rows */}
                <div className="divide-y divide-border">
                  {perms.map((perm) => (
                    <div
                      key={perm.key}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-medium truncate">
                          {perm.label}
                        </span>
                        {perm.description && (
                          <span className="text-xs text-muted truncate">
                            {perm.description}
                          </span>
                        )}
                      </div>
                      <Switch
                        id={`perm-${activeRole}-${perm.key}`}
                        checked={localGrants[perm.key] ?? false}
                        onChange={(val) => handleToggle(perm.key, val)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {!isLoading && permGroups && (
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              type="button"
              disabled={mutation.isPending || !isDirty}
              onClick={handleUndo}
            >
              {MESSAGES.BTN_UNDO}
            </Button>
            <button
              className="primary-button btn-standard"
              type="button"
              disabled={mutation.isPending || !isDirty}
              onClick={handleSave}
            >
              {mutation.isPending ? MESSAGES.BTN_SAVING : MESSAGES.BTN_SAVE}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
