import {
  AddButton,
  ActionBar,
  ViewToggle,
  type ViewMode,
} from '@/shared/components';

import { FINISHED_FABRIC_LIST_LABELS as LIST_MSG } from './finished-fabric.constants';

export interface FinishedFabricListActionsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onNew: () => void;
  onBulkNew: () => void;
  onExport: () => void;
  onPackingList: () => void;
  isExporting: boolean;
}

export function FinishedFabricListActions({
  viewMode,
  onViewModeChange,
  onNew,
  onBulkNew,
  onExport,
  onPackingList,
  isExporting,
}: FinishedFabricListActionsProps) {
  return (
    <div className="flex items-center gap-4">
      <ViewToggle value={viewMode} onChange={onViewModeChange} />

      <div className="flex items-center gap-2 flex-wrap">
        <AddButton onClick={onNew} label={LIST_MSG.BTN_NEW} />

        <ActionBar
          actions={[
            {
              icon: 'Zap',
              title: LIST_MSG.BTN_BULK_NEW,
              onClick: onBulkNew,
            },
            {
              icon: 'ClipboardList',
              title: LIST_MSG.BTN_PACKING_LIST,
              onClick: onPackingList,
            },
            {
              icon: 'FileSpreadsheet',
              title: isExporting ? LIST_MSG.BTN_EXPORTING : LIST_MSG.BTN_EXPORT,
              onClick: onExport,
              disabled: isExporting,
            },
          ]}
        />
      </div>
    </div>
  );
}
