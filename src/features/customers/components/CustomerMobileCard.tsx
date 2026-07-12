import { CUSTOMER_STATUS_LABELS } from '@/schema/customer.schema';
import { Badge, Icon } from '@/shared/components';
import { formatPhoneNumber } from '@/shared/utils/format';
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
            {(() => {
              if (!customer.phone) return '—';
              const cleanPhone = customer.phone.replace(/\D/g, '');
              const isVietnamZalo =
                cleanPhone.startsWith('0') && cleanPhone.length === 10;
              return (
                <>
                  <a
                    href={`tel:${cleanPhone}`}
                    className="hover:text-primary hover:underline font-semibold"
                  >
                    {formatPhoneNumber(customer.phone)}
                  </a>
                  {isVietnamZalo && (
                    <a
                      href={`https://zalo.me/${cleanPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0068FF] bg-[#0068FF]/10 rounded-full w-5 h-5 flex items-center justify-center"
                    >
                      <Icon name="MessageCircle" size={12} />
                    </a>
                  )}
                </>
              );
            })()}
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
