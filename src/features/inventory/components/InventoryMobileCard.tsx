import { Icon, Badge } from '@/shared/components';
import { WeightText, LengthText } from '@/shared/value';
import type { InventoryBreakdownRow, AgingRoll } from '@/application/inventory';
import { AGING_CONFIG, getAgingSeverity } from '@/domain/inventory';
import { INVENTORY_MESSAGES as MSG } from '@/features/inventory/inventory.constants';

export function AgingMobileCard({ roll }: { roll: AgingRoll }) {
  const sev = getAgingSeverity(roll.age_days);
  const cfg = AGING_CONFIG[sev];
  return (
    <div className="mobile-card">
      <div className="mobile-card-header">
        <div className="flex flex-col">
          <span className="mobile-card-title">{roll.roll_number}</span>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
            {roll.source === 'raw' ? MSG.VAL_RAW_FULL : MSG.VAL_FIN_FULL}
          </span>
        </div>
        <Badge variant={cfg.variant}>{cfg.label}</Badge>
      </div>
      <div className="mobile-card-body space-y-3">
        <div className="flex justify-between items-start">
          <p className="font-bold text-foreground">{roll.fabric_type}</p>
          {roll.warehouse_location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Icon name="MapPin" size={14} />
              <span>{roll.warehouse_location}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {roll.color_name && (
            <div className="flex items-center gap-1.5 text-xs bg-surface-subtle px-2 py-1 rounded border border-border/50">
              <Icon name="Palette" size={14} className="text-foreground/70" />
              <span className="font-medium">{roll.color_name}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs bg-surface-subtle px-2 py-1 rounded border border-border/50">
            <Icon name="Clock" size={14} className="text-warning/70" />
            <span className="font-bold">
              {roll.age_days} {MSG.DAYS}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BreakdownMobileCard({ row }: { row: InventoryBreakdownRow }) {
  return (
    <div className="mobile-card">
      <div className="mobile-card-header">
        <div className="flex flex-col">
          <span className="mobile-card-title">{row.fabric_type ?? '—'}</span>
          {row.color_name && (
            <span className="text-[10px] text-muted-foreground font-bold uppercase">
              {row.color_name}
            </span>
          )}
        </div>
        {row.quality_grade && (
          <span className={`grade-badge grade-${row.quality_grade}`}>
            {row.quality_grade}
          </span>
        )}
      </div>
      <div className="mobile-card-body">
        <div className="grid grid-cols-3 gap-2 text-center bg-surface-subtle/50 p-2 rounded-lg border border-border/30">
          <div>
            <p className="text-[9px] uppercase text-muted-foreground font-bold mb-0.5">
              {MSG.COL_ROLL_COUNT}
            </p>
            <p className="text-sm font-black text-muted-foreground">
              {row.roll_count ?? 0}
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase text-muted-foreground font-bold mb-0.5">
              {MSG.VAL_TOTAL_LENGTH}
            </p>
            <LengthText
              value={row.total_length_m ?? 0}
              className="text-sm font-black text-foreground"
              suffix=""
            />
            <span className="text-[10px] ml-0.5 font-black text-foreground">
              m
            </span>
          </div>
          <div>
            <p className="text-[9px] uppercase text-muted-foreground font-bold mb-0.5">
              {MSG.VAL_TOTAL_WEIGHT}
            </p>
            <WeightText
              value={row.total_weight_kg ?? 0}
              className="text-sm font-black text-muted-foreground"
              suffix=""
            />
            <span className="text-[10px] ml-0.5 font-black text-muted-foreground">
              kg
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
