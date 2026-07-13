import { useMemo } from 'react';

import type { Column } from '@/shared/components/DataTable';
import { Icon } from '@/shared/components';
import type { MachineSpecification } from '@/schema/yarn-engineering.schema';
import { LOOM_MESSAGES as MSG } from '@/features/looms/loom.constants';
import {
  StatusBadge,
  SourceTypeBadge,
  getTypeLabel,
} from '@/features/looms/components/MachineSpecMobileCard';

type UseMachineSpecColumnsProps = {
  onEdit: (item: MachineSpecification) => void;
  onToggleStatus: (item: MachineSpecification) => void;
};

export function useMachineSpecColumns({
  onEdit,
  onToggleStatus,
}: UseMachineSpecColumnsProps) {
  return useMemo<Column<MachineSpecification>[]>(
    () => [
      {
        header: MSG.COL_SPEC_CODE,
        id: 'code',
        cell: (item) => {
          return (
            <div>
              <div className="font-medium text-primary">{item.code || '-'}</div>
              <div className="text-xs text-text-tertiary flex gap-1 mt-1">
                <SourceTypeBadge sourceType={item.source_type} />
              </div>
            </div>
          );
        },
      },
      {
        header: MSG.COL_SPEC_TYPE,
        id: 'machine_type',
        cell: (item) => getTypeLabel(item.machine_type),
      },
      {
        header: MSG.COL_SPEC_SIZE,
        id: 'diameter',
        cell: (item) => {
          return (
            <span>
              {item.diameter}" - {item.gauge ? `${item.gauge}G` : '?G'}
            </span>
          );
        },
      },
      {
        header: MSG.COL_SPEC_FEEDER,
        id: 'feeder_count',
        cell: (item) => `${item.feeder_count || '-'} F`,
      },
      {
        header: MSG.COL_SPEC_MANUFACTURER,
        id: 'manufacturer',
        cell: (item) => {
          return (
            <div className="text-sm">
              <div>{item.manufacturer || '-'}</div>
              <div className="text-text-tertiary text-xs">
                {item.machine_family || '-'}
              </div>
            </div>
          );
        },
      },
      {
        header: MSG.COL_SPEC_STATUS,
        id: 'is_active',
        cell: (item) => <StatusBadge isActive={item.is_active} />,
      },
      {
        header: '',
        id: 'actions',
        className: 'w-24 text-right',
        cell: (item) => {
          return (
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="p-1.5 text-text-secondary hover:text-primary transition-colors"
                onClick={() => onEdit(item)}
                title={MSG.BTN_SPEC_EDIT_TOOLTIP}
              >
                <Icon name="Pencil" size={16} />
              </button>
              <button
                type="button"
                className={`p-1.5 transition-colors ${
                  item.is_active
                    ? 'text-red-500 hover:bg-red-50'
                    : 'text-emerald-600 hover:bg-emerald-50'
                } rounded`}
                onClick={() => onToggleStatus(item)}
                title={
                  item.is_active ? MSG.BTN_SPEC_HIDE : MSG.BTN_SPEC_RESTORE
                }
              >
                <Icon
                  name={item.is_active ? 'Trash2' : 'RefreshCw'}
                  size={16}
                />
              </button>
            </div>
          );
        },
      },
    ],
    [onEdit, onToggleStatus],
  );
}
