import { PageLayout } from '@/shared/components';

import { ShipmentList } from './ShipmentList';

export function ShipmentsPage() {
  return (
    <div className="page-container">
      <PageLayout className="flex-1 h-full">
        <ShipmentList />
      </PageLayout>
    </div>
  );
}
