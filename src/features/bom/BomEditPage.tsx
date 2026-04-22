import { useNavigate, useParams } from 'react-router-dom';

import { useBomDetail } from '@/application/production';

import { BomForm } from './BomForm';

export function BomEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: bom, isLoading } = useBomDetail(id ?? null);

  if (isLoading || !id) {
    return (
      <div className="panel-card card-flush">
        <div className="p-8 text-center text-sm text-muted">
          Dang tai du lieu...
        </div>
      </div>
    );
  }

  if (!bom) {
    return (
      <div className="panel-card card-flush">
        <div className="p-8 text-center text-sm text-muted">
          Khong tim thay BOM.
        </div>
      </div>
    );
  }

  return (
    <BomForm
      initialData={bom}
      onSuccess={() => navigate(`/bom/${id}`)}
      onCancel={() => navigate(`/bom/${id}`)}
    />
  );
}
