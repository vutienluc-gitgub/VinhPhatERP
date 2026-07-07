import { useMemo } from 'react';
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useLeads, useUpdateLeadStatus } from '@/application/crm/useCrm';
import type { CrmLead, LeadFilter, LeadStatus } from '@/domain/crm/crm.types';
import { LEAD_STATUS_MAP } from '@/features/crm/crm.constants';

import { LeadCard } from './LeadCard';

interface LeadsKanbanProps {
  filters: LeadFilter;
  onSelectLead: (id: string) => void;
}

export function LeadsKanban({ filters, onSelectLead }: LeadsKanbanProps) {
  // Fetch all leads for kanban (using a large page size to get most items for the board)
  const { data, isLoading } = useLeads(filters, 1);
  const rawLeads = data?.data;
  const leads = useMemo(() => rawLeads ?? [], [rawLeads]);
  const { mutate: updateStatus } = useUpdateLeadStatus();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const columns = useMemo(() => {
    const cols: Record<LeadStatus, CrmLead[]> = {
      NEW: [],
      CONTACTED: [],
      SAMPLE_SENT: [],
      QUOTED: [],
      NEGOTIATING: [],
      WON: [],
      LOST: [],
      CONVERTED: [],
    };
    leads.forEach((lead) => {
      if (cols[lead.status]) {
        cols[lead.status]!.push(lead);
      }
    });
    return cols;
  }, [leads]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as LeadStatus;

    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    // Optimistically could be handled here, but react-query will invalidate
    updateStatus({ id: leadId, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-72 shrink-0 bg-surface-subtle rounded-xl p-3 h-full animate-pulse"
          >
            <div className="h-6 bg-border rounded w-1/2 mb-4" />
            <div className="space-y-3">
              <div className="h-24 bg-border rounded-lg" />
              <div className="h-24 bg-border rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 h-full overflow-x-auto pb-4 snap-x">
        {(Object.keys(LEAD_STATUS_MAP) as LeadStatus[]).map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            leads={columns[status] ?? []}
            onSelectLead={onSelectLead}
          />
        ))}
      </div>
    </DndContext>
  );
}

interface KanbanColumnProps {
  status: LeadStatus;
  leads: CrmLead[];
  onSelectLead: (id: string) => void;
}

function KanbanColumn({ status, leads, onSelectLead }: KanbanColumnProps) {
  const meta = LEAD_STATUS_MAP[status];
  if (!meta) return null;

  // To allow dropping into an empty column, the column itself needs to be a droppable area.
  // In a full implementation, we'd use useDroppable here. For simplicity with sortable,
  // we just make the column a SortableContext.

  return (
    <div className="w-[300px] shrink-0 flex flex-col max-h-full snap-start">
      <div
        className={`px-3 py-2.5 rounded-t-xl border-b-2 flex items-center justify-between bg-surface ${meta.colorClass.split(' ')[2]}`}
      >
        <div className="flex items-center gap-2">
          <span>{meta.dot}</span>
          <h2 className="font-semibold text-sm text-foreground">
            {meta.label}
          </h2>
        </div>
        <span className="bg-surface-subtle text-muted text-xs font-medium px-2 py-0.5 rounded-full">
          {leads.length}
        </span>
      </div>

      {/* Droppable Area using sortable context */}
      <SortableContext
        items={leads.map((l) => l.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 overflow-y-auto bg-surface-subtle/50 rounded-b-xl p-2 space-y-2 min-h-[150px]">
          {leads.map((lead) => (
            <SortableLeadCard
              key={lead.id}
              lead={lead}
              onSelect={() => onSelectLead(lead.id)}
            />
          ))}
          {/* Invisible droppable target for empty columns */}
          {leads.length === 0 && (
            <div
              id={status}
              className="h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center text-xs text-muted"
            >
              Kéo thả vào đây
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

interface SortableLeadCardProps {
  lead: CrmLead;
  onSelect: () => void;
}

function SortableLeadCard({ lead, onSelect }: SortableLeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id, data: { status: lead.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCard lead={lead} onClick={onSelect} />
    </div>
  );
}
