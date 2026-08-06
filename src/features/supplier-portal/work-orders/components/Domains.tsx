export { OverviewDomain } from './OverviewDomain';
export { ProductionDomain } from './ProductionDomain';
export { MaterialDomain } from './MaterialDomain';

import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';

export function QualityDomain() {
  return (
    <Card className="p-6">
      <EmptyState
        icon="check-circle"
        title="Quản lý Chất lượng"
        description="Chưa có dữ liệu QC cho lệnh gia công này."
      />
    </Card>
  );
}

export function DocumentsDomain() {
  return (
    <Card className="p-6">
      <EmptyState
        icon="file-text"
        title="Tài liệu Kỹ thuật"
        description="Chưa có tài liệu đính kèm (Machine Sheet, Color Card)."
      />
    </Card>
  );
}

export function TimelineDomain() {
  return (
    <Card className="p-6">
      <EmptyState
        icon="clock"
        title="Lịch sử Sự kiện"
        description="Event Sourcing Timeline sẽ hiển thị tại đây."
      />
    </Card>
  );
}
