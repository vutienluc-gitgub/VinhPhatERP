import React, { useMemo, useState } from 'react';

import type {
  FinishedFabricFilter,
  FinishedFabricRoll,
} from '@/domain/inventory/finished-fabric.types';
import {
  mapRollToPackingItem,
  useFinishedFabricPackingList,
} from '@/application/inventory';
import { FabricRollPackingListModal } from '@/features/finished-fabric/components/FabricRollPackingListModal';
import { PACKING_LIST_TEXT } from '@/features/finished-fabric/packing-list.constants';
import { BusinessPrintDialog } from '@/shared/components/print';

export interface FinishedFabricPackingListDrawerProps {
  open: boolean;
  onClose: () => void;
  filters?: FinishedFabricFilter;
  /** Current page rows, shown instantly while the full filtered list loads. */
  fallbackRolls?: FinishedFabricRoll[];
}

export const FinishedFabricPackingListDrawer: React.FC<
  FinishedFabricPackingListDrawerProps
> = ({ open, onClose, filters = {}, fallbackRolls = [] }) => {
  const { data: allRolls } = useFinishedFabricPackingList(filters, open);
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  const fallback = useMemo(
    () => fallbackRolls.map(mapRollToPackingItem),
    [fallbackRolls],
  );
  const rolls = allRolls && allRolls.length > 0 ? allRolls : fallback;

  if (!open) return null;

  const documentId = `PKL-${new Date().toISOString().slice(0, 10)}`;

  return (
    <>
      <FabricRollPackingListModal
        open={open}
        onClose={onClose}
        rolls={rolls}
        title={PACKING_LIST_TEXT.TITLE}
        onPrint={() => setShowPrintDialog(true)}
      />

      <BusinessPrintDialog
        isOpen={showPrintDialog}
        onClose={() => setShowPrintDialog(false)}
        documentType="packing_list"
        documentId={documentId}
        customTitle={PACKING_LIST_TEXT.TITLE}
        packingRolls={rolls}
      />
    </>
  );
};
