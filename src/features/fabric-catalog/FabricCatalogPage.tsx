import { useState } from 'react';

import { FabricCatalogForm } from './FabricCatalogForm';
import { FabricCatalogList } from './FabricCatalogList';
import type { FabricCatalog } from './types';

export function FabricCatalogPage() {
  const [editItem, setEditItem] = useState<FabricCatalog | null>(null);
  const [showForm, setShowForm] = useState(false);

  function openCreate() {
    setEditItem(null);
    setShowForm(true);
  }

  function openEdit(catalog: FabricCatalog) {
    setEditItem(catalog);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditItem(null);
  }

  return (
    <>
      <FabricCatalogList onEdit={openEdit} onNew={openCreate} />
      {showForm && <FabricCatalogForm catalog={editItem} onClose={closeForm} />}
    </>
  );
}
