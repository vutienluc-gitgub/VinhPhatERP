import { Icon } from '@/shared/components';
import { MoneyText } from '@/shared/value';
import type { PublicPoDetails } from '@/api/supplier-portal.api';
import { SUPPLIER_PORTAL_LABELS } from '@/features/supplier-portal/supplier-portal.constants';

const TEXT = SUPPLIER_PORTAL_LABELS;

export interface POItemsTableProps {
  po: PublicPoDetails;
}

export function POItemsTable({ po }: POItemsTableProps) {
  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="p-5 md:p-6 border-b border-border">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {TEXT.PO_SECTION_ITEMS}
        </h2>
      </div>
      <div className="divide-y divide-border">
        {po.items.map((item, index) => (
          <div
            key={item.id}
            className="p-4 md:p-6 hover:bg-surface-secondary transition-colors"
          >
            <div className="flex justify-between gap-4 mb-2">
              <h3 className="font-semibold text-foreground">
                {index + 1}. {item.material_name}
              </h3>
              <div className="text-right">
                <p className="font-bold">
                  <MoneyText value={item.line_total} />
                </p>
              </div>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {TEXT.PO_ITEM_QTY}{' '}
                <span className="font-medium text-foreground">
                  {item.order_qty} {item.uom}
                </span>
              </span>
              <span>
                {TEXT.PO_ITEM_PRICE}{' '}
                <span className="font-medium text-foreground">
                  <MoneyText value={item.unit_price} />
                </span>
              </span>
            </div>
            {item.notes && (
              <p className="text-xs text-muted-foreground italic mt-2 bg-surface-secondary p-2 rounded">
                {item.notes}
              </p>
            )}
          </div>
        ))}
      </div>

      {Array.isArray(po.attachments) && po.attachments.length > 0 && (
        <div className="p-4 md:p-6 bg-surface-secondary border-t border-border">
          <h3 className="font-semibold text-sm mb-3">
            {TEXT.PO_ATTACHMENTS_TITLE}
          </h3>
          <div className="flex flex-wrap gap-2">
            {(po.attachments as Array<{ name?: string; url?: string }>).map(
              (file, i: number) => (
                <a
                  key={i}
                  href={file?.url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg hover:border-primary transition-colors text-sm text-foreground no-underline"
                >
                  <Icon
                    name="Paperclip"
                    size={16}
                    className="text-muted-foreground"
                  />
                  <span>
                    {file?.name || `${TEXT.PO_ATTACHMENT_FALLBACK} ${i + 1}`}
                  </span>
                </a>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
