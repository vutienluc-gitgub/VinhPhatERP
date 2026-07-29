import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { PageLayout } from '@/shared/components';

import { FabricCatalogForm } from './FabricCatalogForm';
import { FabricCatalogList } from './FabricCatalogList';
import { ROUTE_FABRIC_CATALOG } from './fabric-catalog.constants';

export function FabricCatalogPage() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  function openCreate() {
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
  }

  return (
    <div className="page-container">
      <PageLayout className="flex-1 h-full">
        <FabricCatalogList
          onEdit={(c) => navigate(`${ROUTE_FABRIC_CATALOG}/${c.id}`)}
          onNew={openCreate}
        />
      </PageLayout>

      {showForm && <FabricCatalogForm catalog={null} onClose={closeForm} />}
    </div>
  );
}
