import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
    <>
      <FabricCatalogList
        onEdit={(c) => navigate(`${ROUTE_FABRIC_CATALOG}/${c.id}`)}
        onNew={openCreate}
      />

      {showForm && <FabricCatalogForm catalog={null} onClose={closeForm} />}
    </>
  );
}
