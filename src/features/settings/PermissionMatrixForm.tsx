import { useEffect, useRef, Fragment } from 'react';

import { Button } from '@/shared/components/Button';
import { Icon } from '@/shared/components/Icon';
import { PanelIcon } from '@/features/settings/PanelIcon';
import {
  PERMISSION_MODULE_LABELS,
  PERMISSION_MODULE_ICONS,
  PERMISSION_ACTION_LABELS,
  ROLE_LABELS,
  CONFIGURABLE_ROLES,
} from '@/schema/permissions.schema';

import { usePermissionMatrix } from './usePermissionMatrix';
import { SETTINGS_LABELS } from './settings.constants';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  indeterminate?: boolean;
}

function Checkbox({ indeterminate, className = '', ...props }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = !!indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      type="checkbox"
      ref={ref}
      className={`cursor-pointer w-4 h-4 accent-[var(--primary)] border-border rounded transition-all duration-200 hover:scale-105 ${className}`}
      {...props}
    />
  );
}

export function PermissionMatrixForm() {
  const {
    allPermissions,
    localGrants,
    searchQuery,
    setSearchQuery,
    isSaving,
    saveSuccess,
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
  } = usePermissionMatrix();

  if (isLoading) {
    return (
      <div className="panel-card card-flush p-6">
        <div className="flex items-center gap-3 mb-6">
          <PanelIcon name="ShieldCheck" color="indigo" />
          <div>
            <span className="font-bold text-lg block">
              {SETTINGS_LABELS.PERM_TITLE}
            </span>
            <span className="text-xs text-muted">
              {SETTINGS_LABELS.PERM_SUBTITLE}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="skeleton-block h-[40px] w-[200px] rounded-md" />
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="skeleton-block h-[42px] w-full" />
            <div className="divide-y divide-border">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`skel-row-${i}`}
                  className="flex gap-4 p-3.5 items-center"
                >
                  <div className="skeleton-block h-[20px] w-1/4 rounded" />
                  <div className="flex-1" />
                  {CONFIGURABLE_ROLES.map((role) => (
                    <div
                      key={`skel-cell-${role}-${i}`}
                      className="skeleton-block h-[20px] w-[60px] rounded"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="panel-card card-flush p-6 text-center">
        <Icon
          name="ShieldAlert"
          size={48}
          className="mx-auto text-[var(--danger)] mb-2"
        />
        <p className="text-sm font-semibold text-[var(--danger)]">
          {errDetail instanceof Error ? errDetail.message : String(errDetail)}
        </p>
        <Button variant="outline" className="mt-4 mx-auto" onClick={handleUndo}>
          {SETTINGS_LABELS.PERM_BTN_RETRY}
        </Button>
      </div>
    );
  }

  if (!allPermissions || allPermissions.length === 0) {
    return (
      <div className="panel-card card-flush p-6 text-center">
        <Icon
          name="ShieldAlert"
          size={48}
          className="mx-auto text-muted mb-2"
        />
        <p className="text-sm text-muted">{SETTINGS_LABELS.PERM_EMPTY}</p>
      </div>
    );
  }

  return (
    <div
      className={`panel-card card-flush transition-all duration-300 ${dirtyCount > 0 ? 'pb-20' : ''}`}
    >
      <div className="card-header-area">
        <div className="flex items-center gap-3">
          <PanelIcon name="ShieldCheck" color="indigo" />
          <div>
            <span className="font-bold text-lg block">
              {SETTINGS_LABELS.PERM_TITLE}
            </span>
            <span className="text-xs text-muted">
              {SETTINGS_LABELS.PERM_SUBTITLE}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-4">
        {/* Controls block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <div className="info-box flex items-center gap-2 text-sm max-w-xl">
            <Icon
              name="Info"
              size={14}
              strokeWidth={2}
              className="text-muted shrink-0"
            />
            <span>{SETTINGS_LABELS.PERM_ADMIN_NOTE}</span>
          </div>

          <div className="perm-search-wrapper ml-auto w-full md:w-auto">
            <Icon name="Search" size={16} className="perm-search-icon" />
            <input
              type="text"
              placeholder={SETTINGS_LABELS.PERM_SEARCH_PLACEHOLDER}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="perm-search-input"
            />
          </div>
        </div>

        {/* Feedback alerts */}
        {saveSuccess && (
          <div className="success-inline">
            <Icon name="CheckCircle2" size={16} strokeWidth={2} />
            {SETTINGS_LABELS.PERM_SAVE_SUCCESS}
          </div>
        )}

        {/* Matrix Table */}
        <div className="perm-matrix-wrapper">
          <table className="perm-matrix">
            <thead>
              <tr>
                <th className="sticky-col min-w-[240px]">
                  {SETTINGS_LABELS.PERM_HEADER_PERMISSION}
                </th>
                {CONFIGURABLE_ROLES.map((role) => {
                  const state = roleCheckStates[role] || {
                    checked: false,
                    indeterminate: false,
                  };
                  return (
                    <th key={role} className="text-center min-w-[110px]">
                      <div className="flex flex-col items-center gap-1.5 py-1">
                        <span className="font-bold text-xs uppercase tracking-wide">
                          {ROLE_LABELS[role] ?? role}
                        </span>
                        <Checkbox
                          id={`header-toggle-${role}`}
                          checked={state.checked}
                          indeterminate={state.indeterminate}
                          onChange={(e) =>
                            handleToggleRole(role, e.target.checked)
                          }
                          title={`Bật/Tắt toàn bộ quyền của ${ROLE_LABELS[role] ?? role}`}
                        />
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {Array.from(filteredGroups.entries()).map(([module, perms]) => {
                if (perms.length === 0) return null;
                return (
                  <Fragment key={`mod-frag-${module}`}>
                    {/* Module header row */}
                    <tr className="perm-matrix-module-row">
                      <td className="sticky-col font-bold">
                        <div className="flex items-center gap-2">
                          <Icon
                            name={PERMISSION_MODULE_ICONS[module] ?? 'Layers'}
                            size={14}
                            strokeWidth={2}
                            className="text-muted"
                          />
                          <span>
                            {PERMISSION_MODULE_LABELS[module] ?? module}
                          </span>
                        </div>
                      </td>
                      {CONFIGURABLE_ROLES.map((role) => {
                        const state = moduleCheckStates[module]?.[role] || {
                          checked: false,
                          indeterminate: false,
                        };
                        return (
                          <td
                            key={`mod-cell-${module}-${role}`}
                            className="text-center"
                          >
                            <Checkbox
                              id={`mod-toggle-${module}-${role}`}
                              checked={state.checked}
                              indeterminate={state.indeterminate}
                              onChange={(e) =>
                                handleToggleModule(
                                  role,
                                  module,
                                  e.target.checked,
                                  perms,
                                )
                              }
                              title={`Bật/Tắt toàn bộ quyền module ${PERMISSION_MODULE_LABELS[module] ?? module} cho ${ROLE_LABELS[role] ?? role}`}
                            />
                          </td>
                        );
                      })}
                    </tr>

                    {/* Permissions list */}
                    {perms.map((perm) => (
                      <tr
                        key={perm.key}
                        className="hover:bg-[var(--surface-hover)]"
                      >
                        <td className="sticky-col py-1.5 px-3">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">
                                {perm.label}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 bg-[var(--surface-subtle)] text-[var(--muted)] rounded font-mono uppercase tracking-tight">
                                {PERMISSION_ACTION_LABELS[perm.action] ??
                                  perm.action}
                              </span>
                            </div>
                            {perm.description && (
                              <span className="text-xs text-muted">
                                {perm.description}
                              </span>
                            )}
                          </div>
                        </td>
                        {CONFIGURABLE_ROLES.map((role) => (
                          <td
                            key={`cell-${role}-${perm.key}`}
                            className="perm-matrix-cell"
                          >
                            <input
                              type="checkbox"
                              id={`perm-${role}-${perm.key}`}
                              checked={localGrants[role]?.[perm.key] ?? false}
                              onChange={(e) =>
                                handleToggle(role, perm.key, e.target.checked)
                              }
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sticky Save Bar */}
      {dirtyCount > 0 && (
        <div className="perm-sticky-bar">
          <div className="flex items-center gap-2 text-white">
            <Icon name="AlertCircle" size={18} className="text-warning" />
            <span className="text-sm font-semibold">
              {SETTINGS_LABELS.PERM_DIRTY_MESSAGE(dirtyCount)}
            </span>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className="!bg-white/10 !text-white hover:!bg-white/20 border-none min-h-[38px] px-4 font-bold"
              disabled={isSaving}
              onClick={handleUndo}
            >
              {SETTINGS_LABELS.PERM_BTN_UNDO}
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="!bg-white !text-[var(--primary)] hover:!bg-white/90 border-none min-h-[38px] px-4 font-bold"
              disabled={isSaving}
              isLoading={isSaving}
              onClick={handleSave}
            >
              {SETTINGS_LABELS.PERM_BTN_SAVE}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
