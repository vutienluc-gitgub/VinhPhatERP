import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';

import { Badge, Button } from '@/shared/components';
import type {
  WorkOrderWithRelations,
  WorkOrderStatus,
} from '@/features/work-orders/types';

interface ColumnDef {
  key: WorkOrderStatus;
  label: string;
  color: string;
}

const COLUMNS: ColumnDef[] = [
  { key: 'draft', label: 'Bản nháp', color: 'bg-slate-100' },
  { key: 'yarn_issued', label: 'Đã xuất sợi', color: 'bg-indigo-100' },
  { key: 'in_progress', label: 'Đang sản xuất', color: 'bg-blue-100' },
  { key: 'completed', label: 'Hoàn thành', color: 'bg-emerald-100' },
];

function KanbanCard({
  wo,
  onView,
  onEdit,
}: {
  wo: WorkOrderWithRelations;
  onView: (id: string) => void;
  onEdit: (wo: WorkOrderWithRelations) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: wo.id, data: { status: wo.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl p-3 shadow-sm border ${
        isDragging
          ? 'border-primary ring-2 ring-primary/20 opacity-50'
          : 'border-border'
      } cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow relative group`}
      {...attributes}
      {...listeners}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-bold text-primary text-sm">
          {wo.work_order_number}
        </span>
        {wo.order && (
          <span
            className="text-[10px] text-muted-foreground max-w-[80px] truncate"
            title={wo.order.order_number}
          >
            ĐH: {wo.order.order_number}
          </span>
        )}
      </div>

      <div className="text-xs space-y-1.5 mb-3">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">BOM:</span>
          <span className="font-medium text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
            {wo.bom_template?.code} (V{wo.bom_version})
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Nhà dệt:</span>
          <span
            className="font-semibold truncate max-w-[120px]"
            title={wo.supplier?.name}
          >
            {wo.supplier?.name}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Mục tiêu:</span>
          <span className="font-bold text-indigo-600">
            {wo.target_quantity.toLocaleString()} m
          </span>
        </div>
      </div>

      {/* Hành động khi Hover (hoặc mặc định trên mobile) */}
      <div className="flex gap-1.5 border-t border-border/50 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="secondary"
          size="sm"
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onView(wo.id);
          }}
          className="h-7 flex-1 text-[11px]"
        >
          Chi tiết
        </Button>
        {wo.status === 'draft' && (
          <Button
            variant="secondary"
            size="sm"
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(wo);
            }}
            className="h-7 flex-1 text-[11px] text-primary"
          >
            Sửa lệnh
          </Button>
        )}
      </div>
    </div>
  );
}

function DroppableColumn({
  col,
  items,
  onView,
  onEdit,
}: {
  col: ColumnDef;
  items: WorkOrderWithRelations[];
  onView: (id: string) => void;
  onEdit: (wo: WorkOrderWithRelations) => void;
}) {
  const { setNodeRef } = useSortable({ id: col.key, data: { type: 'Column' } });

  return (
    <div
      className={`flex flex-col rounded-2xl p-3 w-[280px] shrink-0 h-full ${col.color} bg-opacity-40 border border-slate-200/50`}
    >
      <div className="flex justify-between items-center mb-3 px-1">
        <h3 className="font-bold text-slate-800 text-[13px] uppercase tracking-wider">
          {col.label}
        </h3>
        <Badge variant="gray" className="bg-white/60 text-slate-600 font-bold">
          {items.length}
        </Badge>
      </div>
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-10"
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((wo) => (
            <KanbanCard key={wo.id} wo={wo} onView={onView} onEdit={onEdit} />
          ))}
        </SortableContext>
        {items.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-400 border-2 border-dashed border-slate-300 rounded-xl m-1 opacity-70">
            Trống
          </div>
        )}
      </div>
    </div>
  );
}

interface WorkOrderKanbanBoardProps {
  workOrders: WorkOrderWithRelations[];
  onView: (id: string) => void;
  onEdit: (wo: WorkOrderWithRelations) => void;
  onStatusChange: (
    id: string,
    newStatus: WorkOrderStatus,
    currentWO: WorkOrderWithRelations,
  ) => void;
}

export function WorkOrderKanbanBoard({
  workOrders,
  onView,
  onEdit,
  onStatusChange,
}: WorkOrderKanbanBoardProps) {
  const [activeWO, setActiveWO] = useState<WorkOrderWithRelations | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (e: DragStartEvent) => {
    const { active } = e;
    const wo = workOrders.find((w) => w.id === active.id);
    if (wo) setActiveWO(wo);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveWO(null);
    const { active, over } = e;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const wo = workOrders.find((w) => w.id === activeId);
    if (!wo) return;

    let targetStatus = wo.status;

    // Dropped on a column
    if (COLUMNS.find((c) => c.key === overId)) {
      targetStatus = overId as WorkOrderStatus;
    } else {
      // Dropped on another item
      const overWO = workOrders.find((w) => w.id === overId);
      if (overWO) {
        targetStatus = overWO.status;
      }
    }

    if (targetStatus !== wo.status) {
      onStatusChange(activeId, targetStatus, wo);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto h-[600px] p-2 no-scrollbar bg-slate-50/50 rounded-xl border border-border">
        {COLUMNS.map((col) => {
          const items = workOrders.filter((w) => w.status === col.key);
          return (
            <DroppableColumn
              key={col.key}
              col={col}
              items={items}
              onView={onView}
              onEdit={onEdit}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeWO ? (
          <div className="bg-white rounded-xl p-3 shadow-2xl border border-primary ring-2 ring-primary/20 rotate-3 scale-105 cursor-grabbing w-[280px]">
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-primary text-sm">
                {activeWO.work_order_number}
              </span>
            </div>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nhà dệt:</span>
                <span className="font-bold truncate max-w-[150px]">
                  {activeWO.supplier?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mục tiêu:</span>
                <span className="font-bold text-indigo-600">
                  {activeWO.target_quantity.toLocaleString()} m
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
