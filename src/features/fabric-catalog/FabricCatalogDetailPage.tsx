import { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

import { useFabricCatalogDetail } from '@/application/settings';
import { Icon } from '@/shared/components';

import { FabricCatalogDetail } from './FabricCatalogDetail';
import { FabricCatalogForm } from './FabricCatalogForm';
import { LABELS, ROUTE_FABRIC_CATALOG } from './fabric-catalog.constants';

export function FabricCatalogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const codeParam = searchParams.get('code');
  const navigate = useNavigate();

  const identifier = id || codeParam || undefined;

  const {
    data: catalog,
    isLoading,
    error,
  } = useFabricCatalogDetail(identifier);
  const [showForm, setShowForm] = useState(false);

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center text-muted">
        <Icon name="Loader2" size={32} className="animate-spin" />
      </div>
    );
  }

  if (error || !catalog) {
    return (
      <div className="p-8 text-center text-danger">
        <p>{LABELS.NOT_FOUND}</p>
        <button
          className="btn-secondary mt-4"
          onClick={() => navigate(ROUTE_FABRIC_CATALOG)}
        >
          {LABELS.BACK}
        </button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <FabricCatalogDetail
        catalog={catalog}
        onEdit={() => setShowForm(true)}
        onBack={() => navigate(ROUTE_FABRIC_CATALOG)}
      />

      {showForm && (
        <FabricCatalogForm
          catalog={catalog}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
