import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useRef } from 'react';

import type { Task, Employee, Kpi } from '@/domain/operations/types';

import { TaskCard } from './TaskCard';

interface SortableTaskCardProps {
  task: Task;
  employees: Pick<Employee, 'id' | 'name'>[];
  kpis: Pick<Kpi, 'id' | 'code'>[];
  onClick: () => void;
  onTapMove: (task: Task) => void;
  blockedReason?: string;
  shouldRecoil?: boolean;
}

export function SortableTaskCard({
  task,
  employees,
  kpis,
  onClick,
  onTapMove,
  blockedReason,
  shouldRecoil,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });
  const cardRef = useRef<HTMLDivElement | null>(null);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  useEffect(() => {
    if (!shouldRecoil || !cardRef.current) {
      return;
    }

    cardRef.current.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(6px)' },
        { transform: 'translateX(-4px)' },
        { transform: 'translateX(0)' },
      ],
      {
        duration: 320,
        easing: 'ease-out',
      },
    );
  }, [shouldRecoil]);

  return (
    <TaskCard
      ref={(node) => {
        cardRef.current = node;
        setNodeRef(node);
      }}
      task={task}
      employees={employees}
      kpis={kpis}
      onClick={onClick}
      onTapMove={onTapMove}
      blockedReason={blockedReason}
      className="cursor-grab active:cursor-grabbing touch-none"
      style={style}
      dragAttributes={attributes}
      dragListeners={listeners}
    />
  );
}
