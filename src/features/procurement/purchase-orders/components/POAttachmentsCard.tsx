import { Icon } from '@/shared/components';
import { PO_CONSTANTS } from '@/features/procurement/purchase-orders/purchase-orders.constants';

export function POAttachmentsCard() {
  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border p-6">
      <h3 className="font-semibold text-lg mb-4">
        {PO_CONSTANTS.LABEL_ATTACHMENTS}
      </h3>
      <div className="border-2 border-dashed border-muted rounded-xl p-8 flex flex-col items-center justify-center text-center text-muted hover:bg-gray-50 hover:border-primary cursor-pointer transition-colors">
        <Icon
          name="UploadCloud"
          size={32}
          className="mb-2 text-muted-foreground"
        />
        <p className="text-sm font-medium">{PO_CONSTANTS.UPLOAD_HINT_MAIN}</p>
        <p className="text-xs mt-1">{PO_CONSTANTS.UPLOAD_HINT_SUB}</p>
      </div>
    </div>
  );
}
