import { useState } from 'react';

import { RawFabricBulkForm } from './RawFabricBulkForm';
import { RawFabricForm } from './RawFabricForm';
import { RawFabricList } from './RawFabricList';
import type { RawFabricRoll } from './types';

export function RawFabricPage() {
  const [editRoll, setEditRoll] = useState<RawFabricRoll | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);

  function openCreate() {
    setEditRoll(null);
    setShowForm(true);
  }

  function openEdit(roll: RawFabricRoll) {
    setEditRoll(roll);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditRoll(null);
  }

  return (
    <div className="page-container">
      <RawFabricList
        onEdit={openEdit}
        onNew={openCreate}
        onBulkNew={() => setShowBulkForm(true)}
      />
      {showForm && <RawFabricForm roll={editRoll} onClose={closeForm} />}
      {showBulkForm && (
        <RawFabricBulkForm onClose={() => setShowBulkForm(false)} />
      )}
    </div>
  );
}
