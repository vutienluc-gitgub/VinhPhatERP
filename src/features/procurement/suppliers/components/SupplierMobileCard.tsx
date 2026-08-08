import { Icon, Badge, PhoneContact } from '@/shared/components';
import { SUPPLIER_STATUS_LABELS } from '@/schema/supplier.schema';
import type { Supplier } from '@/features/procurement/suppliers/types';

type SupplierMobileCardProps = {
  supplier: Supplier;
};

export function SupplierMobileCard({ supplier }: SupplierMobileCardProps) {
  return (
    <div className="mobile-card">
      <div className="mobile-card-header">
        <span className="mobile-card-title">{supplier.code}</span>
        <Badge variant={supplier.status === 'active' ? 'success' : 'gray'}>
          {SUPPLIER_STATUS_LABELS[supplier.status]}
        </Badge>
      </div>
      <div className="mobile-card-body space-y-2">
        <p className="font-bold text-lg">{supplier.name}</p>

        <div className="grid grid-cols-2 gap-2 text-sm">
          {supplier.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <PhoneContact phone={supplier.phone} />
            </div>
          )}
          {supplier.contact_person && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon name="User" size={16} />
              <span>{supplier.contact_person}</span>
            </div>
          )}
        </div>

        {supplier.address && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground mt-1">
            <Icon name="MapPin" size={16} className="mt-0.5 flex-shrink-0" />
            <span className="truncate">{supplier.address}</span>
          </div>
        )}

        <div className="flex justify-between items-center pt-2 mt-2 border-t border-border/10">
          <span className="text-[10px] uppercase font-bold text-muted-foreground bg-surface-subtle px-1.5 py-0.5 rounded">
            {supplier.category_name ?? supplier.category}
          </span>
          <Icon
            name="ChevronRight"
            size={16}
            className="text-muted-foreground"
          />
        </div>
      </div>
    </div>
  );
}
