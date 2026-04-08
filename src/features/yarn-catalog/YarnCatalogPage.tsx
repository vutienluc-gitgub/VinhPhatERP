import { useState } from 'react';

import type { YarnCatalog } from './types';
import { YarnCatalogForm } from './YarnCatalogForm';
import { YarnCatalogList } from './YarnCatalogList';

export function YarnCatalogPage() {
  const [editItem, setEditItem] = useState<YarnCatalog | null>(null);
  const [showForm, setShowForm] = useState(false);

  function openCreate() {
    setEditItem(null);
    setShowForm(true);
  }

  function openEdit(catalog: YarnCatalog) {
    setEditItem(catalog);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditItem(null);
  }

  return (
    <>
      <YarnCatalogList onEdit={openEdit} onNew={openCreate} />
      {showForm && <YarnCatalogForm catalog={editItem} onClose={closeForm} />}
    </>
  );
}
