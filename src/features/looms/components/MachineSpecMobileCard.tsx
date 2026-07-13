import { Badge, Button } from '@/shared/components';
import type { MachineSpecification } from '@/schema/yarn-engineering.schema';
import { MACHINE_TYPES } from '@/schema/yarn-engineering.schema';
import { LOOM_MESSAGES as MSG } from '@/features/looms/loom.constants';

// eslint-disable-next-line react-refresh/only-export-components
export function StatusBadge({ isActive }: { isActive: boolean | undefined }) {
  return (
    <Badge
      className={
        isActive
          ? 'bg-emerald-100 text-emerald-800'
          : 'bg-gray-100 text-gray-800'
      }
    >
      {isActive ? MSG.STATUS_ACTIVE : MSG.STATUS_INACTIVE}
    </Badge>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function SourceTypeBadge({
  sourceType,
}: {
  sourceType: string | undefined;
}) {
  if (sourceType === 'auto_generated') {
    return (
      <span className="inline-flex items-center rounded-sm bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
        AUTO
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-sm bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
      MANUAL
    </span>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const getTypeLabel = (val?: string | null) => {
  if (!val) return MSG.ERR_UNKNOWN_TYPE;
  const found = MACHINE_TYPES.find((t) => t.value === val);
  return found ? found.label : val;
};

type MachineSpecMobileCardProps = {
  item: MachineSpecification;
  onEdit: (item: MachineSpecification) => void;
};

export function MachineSpecMobileCard({
  item,
  onEdit,
}: MachineSpecMobileCardProps) {
  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-semibold">{item.code || '-'}</div>
          <div className="text-sm text-gray-500">
            {getTypeLabel(item.machine_type)}
          </div>
        </div>
        <StatusBadge isActive={item.is_active} />
      </div>
      <div className="text-sm mt-2 flex gap-4">
        <span>
          {item.diameter}" - {item.gauge ? `${item.gauge}G` : '?G'}
        </span>
        <span>{item.feeder_count || '-'} F</span>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => onEdit(item)}>
          {MSG.BTN_SPEC_EDIT}
        </Button>
      </div>
    </div>
  );
}
