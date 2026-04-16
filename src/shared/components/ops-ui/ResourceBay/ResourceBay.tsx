import { useDroppable } from '@dnd-kit/core';
import { clsx } from 'clsx';

import { useTapToMove } from '@/shared/components/ops-ui/hooks/useTapToMove';
import { getEntityGradeStyles } from '@/shared/components/ops-ui/utils/gradeColor';
import { ResourceBayProps } from '@/shared/components/ops-ui/ResourceBay/resourceBay.types';

export function ResourceBay({
  id,
  title,
  subtitle,
  icon,
  maxSlots,
  usedSlots,
  children,
}: ResourceBayProps) {
  // Dnd Kit Droppable
  const { isOver, setNodeRef } = useDroppable({
    id: id,
    disabled: usedSlots >= maxSlots, // Auto-lock if full
  });

  // Tap-to-move Receiver Mode
  const { isBayWaiting, onBayTap } = useTapToMove(undefined, id);
  const isFull = usedSlots >= maxSlots;

  return (
    <div
      ref={setNodeRef}
      onClick={isFull ? undefined : onBayTap}
      className={clsx(
        'flex flex-col gap-4 rounded-3xl border p-4 sm:p-6 transition-colors duration-300 relative',
        // Visual Feedback when dragging over
        isOver &&
          !isFull &&
          'bg-indigo-50/50 border-indigo-400 ring-4 ring-indigo-500/20',
        // Visual Feedback when something is tapped and looking for a bay
        isBayWaiting &&
          !isFull &&
          !isOver &&
          'border-indigo-300 border-dashed animate-pulse cursor-pointer',
        !isOver && !isBayWaiting && 'border-slate-200 bg-white shadow-sm',
      )}
    >
      {/* BAY HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-inner">
              {icon}
            </div>
          )}
          <div className="flex flex-col">
            <h3 className="text-lg font-black uppercase text-slate-800 line-clamp-1">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm font-medium text-slate-500 line-clamp-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* BAY PROGRESS CAPACITy */}
        <div
          className={clsx(
            'flex items-center gap-3 rounded-xl px-4 py-2 border transition-colors',
            isFull
              ? 'bg-rose-50 border-rose-100'
              : 'bg-slate-50 border-slate-100',
          )}
        >
          <div className="text-right hidden sm:block">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Sức chứa (Slot)
            </span>
            <span
              className={clsx(
                'text-sm font-black',
                isFull ? 'text-rose-600' : 'text-slate-700',
              )}
            >
              {usedSlots} / {maxSlots}
            </span>
          </div>
          {/* Progress Bar */}
          <div className="h-8 w-2 rounded-full bg-slate-200 overflow-hidden flex flex-col justify-end">
            <div
              className={clsx(
                'w-full transition-all duration-500',
                isFull ? 'bg-rose-500' : 'bg-indigo-500',
              )}
              style={{
                height: `${Math.min(100, (usedSlots / maxSlots) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* MATRIX SLOTS (Trực tiếp lồng các Entity Card vào đây) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 relative z-10">
        {children}

        {/* Render Ghost Slots missing to fill capacity visually */}
        {Array.from({ length: Math.max(0, maxSlots - usedSlots) }).map(
          (_, idx) => (
            <div
              key={`ghost-${id}-${idx}`}
              className={clsx(
                'flex h-[64px] min-w-[120px] items-center justify-center rounded-xl',
                getEntityGradeStyles('GHOST'),
              )}
            >
              <span className="text-[10px] font-bold tracking-widest opacity-40 uppercase">
                Trống
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
