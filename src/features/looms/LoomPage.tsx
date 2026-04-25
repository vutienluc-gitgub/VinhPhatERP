import { useState } from 'react';

import { LoomForm } from './LoomForm';
import { LoomList } from './LoomList';
import type { LoomWithSupplier } from './types';

export function LoomPage() {
  const [editItem, setEditItem] = useState<LoomWithSupplier | null>(null);
  const [showForm, setShowForm] = useState(false);

  function openCreate() {
    setEditItem(null);
    setShowForm(true);
  }

  function openEdit(loom: LoomWithSupplier) {
    setEditItem(loom);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditItem(null);
  }

  return (
    <div className="page-container">
      <LoomList onEdit={openEdit} onNew={openCreate} />
      {showForm && <LoomForm loom={editItem} onClose={closeForm} />}
    </div>
  );
}
