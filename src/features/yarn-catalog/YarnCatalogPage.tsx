import { useState } from 'react';

import { PageLayout } from '@/shared/components';

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
    <div className="page-container">
      <PageLayout className="flex-1 h-full">
        <YarnCatalogList onEdit={openEdit} onNew={openCreate} />
      </PageLayout>
      {showForm && <YarnCatalogForm catalog={editItem} onClose={closeForm} />}
    </div>
  );
}
