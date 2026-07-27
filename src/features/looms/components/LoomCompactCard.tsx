import { clsx } from 'clsx';

import { Icon } from '@/shared/components';
import { ActionMenu } from '@/shared/components';
import { LOOM_TYPE_LABELS, LOOM_STATUS_LABELS } from '@/schema/loom.schema';
import type { LoomWithSupplier } from '@/domain/settings/looms.types';

type Props = {
  loom: LoomWithSupplier;
  onEdit: (loom: LoomWithSupplier) => void;
  onDelete: (loom: LoomWithSupplier) => void;
  isDeleting?: boolean;
};

export function LoomCompactCard({ loom, onEdit, onDelete, isDeleting }: Props) {
  // Status colors based on MES standard
  const statusColorMap = {
    running: 'bg-success-soft text-white',
    idle: 'bg-surface-strong text-white',
    maintenance: 'bg-warning-soft text-white',
    breakdown: 'bg-danger-soft text-white',
    setup: 'bg-purple-500 text-white',
  };

  const statusBg = statusColorMap[loom.status] ?? statusColorMap.idle;
  const statusLabel = LOOM_STATUS_LABELS[loom.status] ?? 'Không rõ';

  return (
    <div
      className="relative flex flex-col bg-surface border border-border/60 rounded-xl overflow-hidden hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group"
      onClick={() => onEdit(loom)}
    >
      {/* Top Banner: Status & Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-surface-subtle/50">
        <div className="flex items-center gap-2">
          <div
            className={clsx(
              'px-2 py-0.5 rounded text-[0.7rem] font-bold uppercase tracking-wider',
              statusBg,
            )}
          >
            {statusLabel}
          </div>
          <span className="text-xs text-muted font-medium truncate max-w-[120px]">
            {loom.supplier?.code ?? 'N/A'}
          </span>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <ActionMenu
            items={[
              {
                label: 'Chỉnh sửa',
                icon: 'Pencil',
                onClick: () => onEdit(loom),
              },
              {
                label: 'Xóa máy',
                icon: 'Trash2',
                onClick: () => onDelete(loom),
                danger: true,
                disabled: isDeleting,
              },
            ]}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 flex flex-col gap-3">
        <div>
          <h3 className="text-lg font-bold text-foreground tracking-tight leading-none mb-1">
            {loom.code}
          </h3>
          <p className="text-sm text-muted-foreground font-medium">
            {LOOM_TYPE_LABELS[loom.loom_type]}
          </p>
        </div>

        {/* Technical Badges */}
        <div className="flex flex-wrap gap-1.5 mt-1">
          {loom.diameter_inch ? (
            <span className="px-2 py-1 bg-blue-50 dark:bg-info-soft/10 text-info dark:text-info rounded-md text-xs font-semibold">
              {loom.diameter_inch}"
            </span>
          ) : null}
          {loom.gauge ? (
            <span className="px-2 py-1 bg-blue-50 dark:bg-info-soft/10 text-info dark:text-info rounded-md text-xs font-semibold">
              {loom.gauge}G
            </span>
          ) : null}
          {loom.feeders ? (
            <span className="px-2 py-1 bg-indigo-50 dark:bg-info-soft/10 text-info dark:text-info rounded-md text-xs font-semibold">
              {loom.feeders}F
            </span>
          ) : null}
          {loom.needles ? (
            <span className="px-2 py-1 bg-surface-secondary dark:bg-surface-strong text-secondary dark:text-muted rounded-md text-xs font-semibold">
              {loom.needles} N
            </span>
          ) : null}
          {loom.max_speed_rpm ? (
            <span className="px-2 py-1 bg-amber-50 dark:bg-warning-soft/10 text-warning-strong dark:text-warning rounded-md text-xs font-semibold">
              {loom.max_speed_rpm} RPM
            </span>
          ) : null}
        </div>

        {/* Capabilities */}
        <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-border/40">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="Layers" size={14} className="text-muted-foreground" />
            <span className="truncate" title={loom.yarn_support ?? 'Không rõ'}>
              {loom.yarn_support || 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon name="Scale" size={14} className="text-muted-foreground" />
              <span>GSM: {loom.gsm_range || 'N/A'}</span>
            </div>
            <div className="font-bold text-success dark:text-success">
              {loom.daily_capacity_kg
                ? `${loom.daily_capacity_kg} kg/day`
                : 'N/A'}
            </div>
          </div>
        </div>

        {/* Realtime KPI */}
        {loom.status === 'running' && loom.production_state && (
          <div className="mt-2 p-2 bg-emerald-50 dark:bg-success-soft/10 rounded-lg flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-success dark:text-success font-medium">
                Efficiency
              </span>
              <span className="text-success dark:text-success font-bold">
                {loom.production_state.efficiency_pct ?? 0}%
              </span>
            </div>
            <div className="w-full bg-success-soft dark:bg-success-soft rounded-full h-1.5">
              <div
                className="bg-success-soft h-1.5 rounded-full"
                style={{
                  width: `${loom.production_state.efficiency_pct ?? 0}%`,
                }}
              ></div>
            </div>
            {loom.production_state.current_work_order && (
              <div
                className="text-[0.65rem] text-success/80 dark:text-success/80 mt-1 truncate"
                title={`Lệnh sản xuất: ${loom.production_state.current_work_order.work_order_number}`}
              >
                Lệnh:{' '}
                {loom.production_state.current_work_order.work_order_number}
                {loom.production_state.current_work_order.order?.order_number
                  ? ` • ĐH: ${loom.production_state.current_work_order.order.order_number}`
                  : ''}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
