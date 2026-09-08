import { Icon } from '@/shared/components';
import type { PublicPoDetails } from '@/api/supplier-portal.api';
import { SUPPLIER_PORTAL_LABELS } from '@/features/supplier-portal/supplier-portal.constants';

const TEXT = SUPPLIER_PORTAL_LABELS;

export interface POViewerHeaderProps {
  po: PublicPoDetails;
  isConfirmedBySupplier: boolean;
  isRejectedBySupplier: boolean;
}

export function POViewerHeader({
  po,
  isConfirmedBySupplier,
  isRejectedBySupplier,
}: POViewerHeaderProps) {
  return (
    <div className="bg-primary text-inverse-foreground py-6 px-4 md:px-8">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold mb-1">
            {TEXT.PO_HEADER_PREFIX} {po.po_code}
          </h1>
          <p className="text-info text-sm">{TEXT.COMPANY_NAME}</p>
        </div>
        <div className="flex items-center gap-4">
          {isConfirmedBySupplier && (
            <div className="bg-success/20 text-success-light px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 print:hidden">
              <Icon name="CheckCircle" size={16} /> {TEXT.PO_STATUS_CONFIRMED}
            </div>
          )}
          {isRejectedBySupplier && (
            <div className="bg-danger/20 text-danger-soft px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 print:hidden">
              <Icon name="XCircle" size={16} /> {TEXT.PO_STATUS_REJECTED}
            </div>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 bg-surface/10 hover:bg-inverse-foreground/20 text-inverse-foreground rounded transition-colors print:hidden flex items-center gap-2 cursor-pointer"
            title={TEXT.PRINT_BTN}
          >
            <Icon name="Printer" size={20} />
            <span className="hidden sm:inline text-sm font-medium">
              {TEXT.PO_PRINT}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
