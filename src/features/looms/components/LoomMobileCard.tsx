import { Icon } from '@/shared/components/Icon';
import { formatQuantity } from '@/shared/value/core/formatter';
import type { LoomStatus } from '@/schema/loom.schema';
import { LOOM_STATUS_LABELS, LOOM_TYPE_LABELS } from '@/schema/loom.schema';
import type { LoomWithSupplier } from '@/features/looms/types';

interface LoomMobileCardProps {
  loom: LoomWithSupplier;
  onEdit: (loom: LoomWithSupplier) => void;
  onDelete: (loom: LoomWithSupplier) => void;
  isDeleting: boolean;
}

function SaaSBadge({ status }: { status: LoomStatus }) {
  const label = LOOM_STATUS_LABELS[status];

  const styles: Record<string, string> = {
    active:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20',
    maintenance:
      'bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/20',
    inactive:
      'bg-slate-500/10 text-slate-700 dark:text-slate-400 ring-slate-500/20',
  };
  const dotColors: Record<string, string> = {
    active: 'bg-emerald-500',
    maintenance: 'bg-amber-500',
    inactive: 'bg-slate-500',
  };

  const currentStyle = styles[status] || styles.inactive;
  const currentDot = dotColors[status] || dotColors.inactive;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${currentStyle}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${currentDot}`} />
      {label}
    </span>
  );
}

export { SaaSBadge };

export function LoomMobileCard({
  loom: l,
  onEdit,
  onDelete,
  isDeleting,
}: LoomMobileCardProps) {
  return (
    <div className="mobile-card">
      <div className="mobile-card-header">
        <span className="mobile-card-title text-lg font-bold">{l.code}</span>
        <SaaSBadge status={l.status} />
      </div>
      <div className="mobile-card-body space-y-2">
        <p className="font-bold text-sm">{l.name}</p>
        <p className="text-xs text-muted italic">
          {LOOM_TYPE_LABELS[l.loom_type]}
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex flex-col">
            <span className="text-xs text-muted">Nhà dệt</span>
            <span className="font-medium">{l.supplier?.name ?? '—'}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-xs text-muted">Công suất</span>
            <span className="font-bold text-primary">
              {l.daily_capacity_m
                ? `${formatQuantity(l.daily_capacity_m, 0)} m/ngày`
                : '—'}
            </span>
          </div>
        </div>
        <div className="flex justify-between items-center text-xs text-muted pt-2 border-t border-border/10">
          <span>
            {l.max_width_cm ? `Khổ: ${l.max_width_cm} cm` : ''}
            {l.max_width_cm && (l.diameter_inch || l.gauge) ? ' | ' : ''}
            {l.diameter_inch ? `${l.diameter_inch}"` : ''}
            {l.diameter_inch && l.gauge ? 'x' : ''}
            {l.gauge ? `${l.gauge}G` : ''}
            {(l.max_width_cm || l.diameter_inch || l.gauge) &&
            l.year_manufactured
              ? ' | '
              : ''}
            {l.year_manufactured ? `Năm SX: ${l.year_manufactured}` : ''}
          </span>
          <div className="flex gap-2">
            <button
              className="btn-icon p-1"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(l);
              }}
            >
              <Icon name="Pencil" size={16} />
            </button>
            <button
              className="btn-icon p-1 text-danger"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(l);
              }}
              disabled={isDeleting}
            >
              <Icon name="Trash2" size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
