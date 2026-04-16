import { useDraggable } from '@dnd-kit/core';
import { clsx } from 'clsx';

import { Icon } from '@/shared/components/Icon';
import { getEntityGradeStyles } from '@/shared/components/ops-ui/utils/gradeColor';
import { useTapToMove } from '@/shared/components/ops-ui/hooks/useTapToMove';

import { EntityCardProps } from './entityCard.types';

export function EntityCard({
  id,
  grade,
  title,
  subtitle,
  isLocked = false,
}: EntityCardProps) {
  // Setup DND Kit Draggable
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: id,
    disabled: isLocked || grade === 'RESERVED',
  });

  // Setup Tap-to-move for touch-devices
  const { isSelected, onEntityTap } = useTapToMove(id);

  const styleBase = getEntityGradeStyles(grade);

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onEntityTap}
      className={clsx(
        'group relative flex min-h-[64px] min-w-[120px] items-center gap-2 rounded-xl border p-2.5 transition-all touch-none select-none select-none outline-none',
        styleBase,
        !isLocked &&
          grade !== 'RESERVED' &&
          'cursor-grab active:cursor-grabbing hover:-translate-y-0.5',
        (isDragging || isSelected) &&
          'ring-4 ring-indigo-500/30 scale-105 z-10 shadow-xl',
        isDragging && 'opacity-80',
      )}
    >
      {!isLocked && grade !== 'RESERVED' && (
        <Icon
          name="GripVertical"
          size={16}
          className="opacity-30 transition-opacity group-hover:opacity-100 flex-shrink-0"
        />
      )}

      <div className="flex flex-col flex-1 justify-center leading-tight overflow-hidden">
        <span className="font-extrabold tracking-tight truncate">{title}</span>
        {subtitle && (
          <span className="text-[11px] font-medium opacity-80 truncate">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
