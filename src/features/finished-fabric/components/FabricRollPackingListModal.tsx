import React from 'react';

import type { FabricRollPackingItem } from '@/domain/inventory/packing-list.types';
import { FabricRollPackingTable } from '@/features/finished-fabric/components/FabricRollPackingTable';
import { PACKING_LIST_TEXT } from '@/features/finished-fabric/packing-list.constants';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';

export interface FabricRollPackingListModalProps {
  open: boolean;
  onClose: () => void;
  rolls: FabricRollPackingItem[];
  title?: string;
  subtitle?: string;
  onPrint?: () => void;
}

export const FabricRollPackingListModal: React.FC<
  FabricRollPackingListModalProps
> = ({
  open,
  onClose,
  rolls,
  title = PACKING_LIST_TEXT.TITLE,
  subtitle = PACKING_LIST_TEXT.SUBTITLE,
  onPrint,
}) => {
  return (
    <AdaptiveSheet open={open} onClose={onClose} title={title} size="xl">
      <div className="py-2">
        <FabricRollPackingTable
          rolls={rolls}
          title={title}
          subtitle={subtitle}
          onPrint={onPrint}
        />
      </div>
    </AdaptiveSheet>
  );
};
