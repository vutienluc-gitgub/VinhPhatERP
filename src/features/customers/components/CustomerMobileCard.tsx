import { CUSTOMER_STATUS_LABELS } from '@/schema/customer.schema';
import { Badge, PhoneContact } from '@/shared/components';
import type { Customer } from '@/features/customers/types';

type CustomerMobileCardProps = {
  customer: Customer;
};

export function CustomerMobileCard({ customer }: CustomerMobileCardProps) {
  return (
    <div className="mobile-card">
      <div className="mobile-card-header">
        <span className="mobile-card-title">{customer.code}</span>
        <Badge
          variant={customer.status === 'active' ? 'success' : 'gray'}
          icon={customer.status === 'active' ? 'CheckCircle2' : 'XCircle'}
        >
          {CUSTOMER_STATUS_LABELS[customer.status]}
        </Badge>
      </div>
      <div className="mobile-card-body">
        <p className="font-bold text-lg">{customer.name}</p>
        <div className="mobile-card-row">
          <span className="label">Liên hệ:</span>
          <span className="value flex items-center gap-2">
            <PhoneContact phone={customer.phone} />
          </span>
        </div>
        {customer.address && (
          <div className="mobile-card-row">
            <span className="label">Địa chỉ:</span>
            <span className="value truncate ml-4 italic">
              {customer.address}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
