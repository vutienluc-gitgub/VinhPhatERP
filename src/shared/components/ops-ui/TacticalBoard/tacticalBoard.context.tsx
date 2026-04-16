import { createContext } from 'react';

export interface TacticalBoardContextValue {
  activeTapEntity: string | null;
  setActiveTapEntity: (id: string | null) => void;
  triggerMoveAction: (entityId: string, targetBayId: string) => void;
}

export const TacticalBoardContext =
  createContext<TacticalBoardContextValue | null>(null);
