import { useState } from 'react';

import { PageLayout } from '@/shared/components';

import { FinishedFabricBulkForm } from './FinishedFabricBulkForm';
import { FinishedFabricForm } from './FinishedFabricForm';
import { FinishedFabricList } from './FinishedFabricList';
import { TraceChainPanel } from './TraceChainPanel';
import type { FinishedFabricRoll } from './types';

export function FinishedFabricPage() {
  const [editRoll, setEditRoll] = useState<FinishedFabricRoll | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [traceRoll, setTraceRoll] = useState<FinishedFabricRoll | null>(null);

  function openCreate() {
    setEditRoll(null);
    setShowForm(true);
  }

  function openEdit(roll: FinishedFabricRoll) {
    setEditRoll(roll);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditRoll(null);
  }

  return (
    <div className="page-container">
      <PageLayout className="flex-1 h-full">
        <FinishedFabricList
          onEdit={openEdit}
          onNew={openCreate}
          onBulkNew={() => setShowBulkForm(true)}
          onTrace={(roll) => setTraceRoll(roll)}
        />
      </PageLayout>
      {showForm && <FinishedFabricForm roll={editRoll} onClose={closeForm} />}
      {showBulkForm && (
        <FinishedFabricBulkForm onClose={() => setShowBulkForm(false)} />
      )}
      {traceRoll && (
        <TraceChainPanel roll={traceRoll} onClose={() => setTraceRoll(null)} />
      )}
    </div>
  );
}
