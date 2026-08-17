import { Badge } from '@/shared/components';
import { ROLL_STATUS_LABELS } from '@/schema/raw-fabric.schema';
import type { RawFabricRoll } from '@/domain/inventory/raw-fabric.types';
import { RAW_FABRIC_MESSAGES as MSG } from '@/features/raw-fabric/raw-fabric.constants';
import { getRollStatusVariant } from '@/shared/utils/status-variant';

type RawFabricMobileCardProps = {
  roll: RawFabricRoll;
};

export function RawFabricMobileCard({ roll: r }: RawFabricMobileCardProps) {
  return (
    <div className="mobile-card">
      <div className="mobile-card-header">
        <span className="mobile-card-title">{r.roll_number}</span>
        <Badge variant={getRollStatusVariant(r.status)}>
          {ROLL_STATUS_LABELS[r.status]}
        </Badge>
      </div>
      <div className="mobile-card-body">
        <div className="flex justify-between items-center mb-1 gap-2">
          <span className="text-sm font-medium break-words min-w-0 flex-1">
            {r.fabric_type}
          </span>
          <span className="text-xs text-muted-foreground shrink-0 text-right">
            {MSG.LBL_LOT} {r.lot_number || '—'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-muted-foreground">
              {MSG.COL_WEIGHT}
            </span>
            <span className="font-bold text-sm">{r.weight_kg} kg</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-muted-foreground">
              {MSG.COL_LENGTH}
            </span>
            <span className="font-bold text-sm text-success">
              {r.length_m} m
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
