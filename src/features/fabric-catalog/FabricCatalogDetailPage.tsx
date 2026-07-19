import { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

import { useFabricCatalogDetail } from '@/application/settings';
import { PageLayout, PageHeader, Button } from '@/shared/components';

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
      <PageLayout>
        <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-border bg-surface">
          <div className="h-8 w-64 bg-surface-hover rounded animate-pulse" />
          <div className="h-5 w-32 bg-surface-hover rounded animate-pulse mt-2" />
        </div>
        <div className="px-4 sm:px-6 lg:px-8 mt-4 space-y-6">
          <div className="h-64 bg-surface-subtle rounded-lg animate-pulse" />
        </div>
      </PageLayout>
    );
  }

  if (error || !catalog) {
    return (
      <PageLayout>
        <div className="p-8 text-center text-danger">
          <p>{LABELS.NOT_FOUND}</p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => navigate(ROUTE_FABRIC_CATALOG)}
          >
            {LABELS.BACK}
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title={catalog.name}
        subtitle={`${LABELS.CODE}: ${catalog.code}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              leftIcon="ArrowLeft"
              onClick={() => navigate(ROUTE_FABRIC_CATALOG)}
            >
              {LABELS.BACK}
            </Button>
            <Button
              variant="primary"
              leftIcon="Pencil"
              onClick={() => setShowForm(true)}
            >
              {LABELS.EDIT}
            </Button>
          </div>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 mt-4 space-y-6">
        <FabricCatalogDetail catalog={catalog} />
      </div>

      {showForm && (
        <FabricCatalogForm
          catalog={catalog}
          onClose={() => setShowForm(false)}
        />
      )}
    </PageLayout>
  );
}
