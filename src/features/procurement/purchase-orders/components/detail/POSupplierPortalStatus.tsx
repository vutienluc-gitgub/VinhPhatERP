import dayjs from 'dayjs';
import { toast } from 'react-hot-toast';

import { Button, Icon } from '@/shared/components';
import type { PurchaseOrder } from '@/domain/purchase-orders';

interface POSupplierPortalStatusProps {
  po: PurchaseOrder;
}

export function POSupplierPortalStatus({ po }: POSupplierPortalStatusProps) {
  if (!po.public_token) return null;

  const portalUrl = `${window.location.origin}/po/${po.public_token}`;

  const copyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    toast.success('Đã sao chép link Portal');
  };

  const getStatusDisplay = () => {
    if (po.confirmed_at) {
      return (
        <div className="flex items-center gap-1.5 text-success text-sm font-medium">
          <Icon name="CheckCircle2" className="w-4 h-4" />
          <span>
            Đã xác nhận lúc {dayjs(po.confirmed_at).format('HH:mm DD/MM/YYYY')}
          </span>
        </div>
      );
    }
    if (po.supplier_viewed_at) {
      return (
        <div className="flex items-center gap-1.5 text-info text-sm font-medium">
          <Icon name="Eye" className="w-4 h-4" />
          <span>
            Đã xem lúc {dayjs(po.supplier_viewed_at).format('HH:mm DD/MM/YYYY')}
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-muted text-sm font-medium">
        <Icon name="Mail" className="w-4 h-4" />
        <span>Chưa mở</span>
      </div>
    );
  };

  return (
    <div className="bg-slate-50 border border-border rounded-lg p-3 space-y-2 mt-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-muted-foreground">
          Trạng thái Portal:
        </span>
        {getStatusDisplay()}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <input
          type="text"
          value={portalUrl}
          readOnly
          className="flex-1 text-xs px-2 py-1.5 bg-white border border-border rounded text-muted-foreground outline-none"
        />
        <Button
          variant="outline"
          size="sm"
          className="h-[30px] px-2 text-xs"
          onClick={copyLink}
        >
          <Icon name="Copy" className="w-3.5 h-3.5 mr-1" />
          Copy
        </Button>
      </div>
    </div>
  );
}
