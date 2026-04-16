import { useContext } from 'react';

import { TacticalBoardContext } from '@/shared/components/ops-ui/TacticalBoard/tacticalBoard.context';

export function useTapToMove(entityId?: string, bayId?: string) {
  const context = useContext(TacticalBoardContext);

  if (!context) {
    throw new Error('useTapToMove must be used within <TacticalBoard>');
  }

  const { activeTapEntity, setActiveTapEntity, triggerMoveAction } = context;

  const onEntityTap = () => {
    if (!entityId) return;
    if (activeTapEntity === entityId) {
      setActiveTapEntity(null);
    } else {
      setActiveTapEntity(entityId);
    }
  };

  const onBayTap = () => {
    if (!bayId) return;
    if (activeTapEntity) {
      triggerMoveAction(activeTapEntity, bayId);
      setActiveTapEntity(null);
    }
  };

  return {
    isSelected: activeTapEntity === entityId,
    isBayWaiting: activeTapEntity !== null, // True nếu đang có 1 vật phẩm được chọn lơ lửng
    onEntityTap,
    onBayTap,
  };
}
