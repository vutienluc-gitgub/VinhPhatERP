import { useNavigate } from 'react-router-dom';

import { BomForm } from './BomForm';

export function BomCreatePage() {
  const navigate = useNavigate();

  return (
    <BomForm
      onSuccess={() => navigate('/bom')}
      onCancel={() => navigate('/bom')}
    />
  );
}
