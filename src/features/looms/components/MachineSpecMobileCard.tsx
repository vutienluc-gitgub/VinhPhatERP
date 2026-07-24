import { Button } from '@/shared/components';
import type { MachineSpecification } from '@/schema/yarn-engineering.schema';
import { MACHINE_TYPES } from '@/schema/yarn-engineering.schema';
import { LOOM_MESSAGES as MSG } from '@/features/looms/loom.constants';
import { StatusBadge } from '@/shared/components';
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
        <StatusBadge
          domain="ACTIVE_STATUS"
          status={item.is_active ? 'active' : 'inactive'}
        />
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
