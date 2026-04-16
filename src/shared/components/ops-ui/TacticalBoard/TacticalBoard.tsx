import React, { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragEndEvent,
} from '@dnd-kit/core';

import { TacticalBoardContext } from './tacticalBoard.context';

export interface TacticalBoardProps {
  children: React.ReactNode;
  /**
   * Called when an entity is dragged to a new bay or tapped into a new bay.
   */
  onMoveComplete: (entityId: string, targetBayId: string) => void;
}

export function TacticalBoard({
  children,
  onMoveComplete,
}: TacticalBoardProps) {
  const [activeTapEntity, setActiveTapEntity] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Cấp độ nhạy: Cần kéo 5px mới kích hoạt dnd (giúp không chặn onClick chạm)
      },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && over.id) {
      onMoveComplete(String(active.id), String(over.id));
    }
    setActiveTapEntity(null);
  };

  const triggerMoveAction = (entityId: string, targetBayId: string) => {
    onMoveComplete(entityId, targetBayId);
    setActiveTapEntity(null);
  };

  return (
    <TacticalBoardContext.Provider
      value={{
        activeTapEntity,
        setActiveTapEntity,
        triggerMoveAction,
      }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        {children}
      </DndContext>
    </TacticalBoardContext.Provider>
  );
}
