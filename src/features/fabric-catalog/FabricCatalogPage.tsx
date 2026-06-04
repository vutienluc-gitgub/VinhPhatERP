import { useState } from 'react';

import { FabricCatalogDetail } from './FabricCatalogDetail';
import { FabricCatalogForm } from './FabricCatalogForm';
import { FabricCatalogList } from './FabricCatalogList';
import type { FabricCatalog } from './types';

type PageView = 'list' | 'detail';

export function FabricCatalogPage() {
  const [view, setView] = useState<PageView>('list');
  const [selectedCatalog, setSelectedCatalog] = useState<FabricCatalog | null>(
    null,
  );
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

  function openDetail(catalog: FabricCatalog) {
    setSelectedCatalog(catalog);
    setView('detail');
  }

  function backToList() {
    setView('list');
    setSelectedCatalog(null);
  }

  function closeForm() {
    setShowForm(false);
    setEditItem(null);
  }

  return (
    <div className="page-container">
      <div className={view === 'list' ? 'block' : 'hidden'}>
        <FabricCatalogList onEdit={openDetail} onNew={openCreate} />
      </div>

      {view === 'detail' && selectedCatalog && (
        <FabricCatalogDetail
          catalog={selectedCatalog}
          onEdit={() => openEdit(selectedCatalog)}
          onBack={backToList}
        />
      )}

      {showForm && <FabricCatalogForm catalog={editItem} onClose={closeForm} />}
    </div>
  );
}
