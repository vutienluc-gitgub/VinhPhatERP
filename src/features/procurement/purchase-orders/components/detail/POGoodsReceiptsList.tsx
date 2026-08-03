import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

import { QuantityText } from '@/shared/value';
import { PO_CONSTANTS } from '@/features/procurement/purchase-orders/purchase-orders.constants';
import { Button, Icon } from '@/shared/components';
import type {
  PurchaseOrder,
  GoodsReceipt,
  GoodsReceiptItem,
} from '@/domain/purchase-orders';

interface POGoodsReceiptsListProps {
  po: PurchaseOrder;
  receipts: GoodsReceipt[];
  onOpenForm: () => void;
}

export function POGoodsReceiptsList({
  po,
  receipts,
  onOpenForm,
}: POGoodsReceiptsListProps) {
  return (
    <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden mt-6">
      <div className="p-4 border-b border-border bg-gray-50/50">
        <h3 className="font-semibold text-lg m-0">
          {PO_CONSTANTS.GR_HISTORY_TITLE}
        </h3>
      </div>
      {receipts.length === 0 ? (
        <div className="p-16 flex flex-col items-center justify-center text-center bg-gray-50/50 border-2 border-dashed border-default rounded-xl m-4">
          <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mb-5 text-muted-foreground">
            <Icon name="PackageOpen" size={40} />
          </div>
          <h4 className="text-xl font-bold text-foreground mb-2">
            {PO_CONSTANTS.GR_EMPTY_TITLE}
          </h4>
          <p className="text-base text-muted max-w-md mb-8">
            {PO_CONSTANTS.GR_EMPTY_DESC}
          </p>
          {(po.status === 'approved' || po.status === 'partial_received') && (
            <Button
              variant="primary"
              size="lg"
              className="shadow-sm px-6"
              onClick={onOpenForm}
            >
              <Icon name="Plus" size={20} className="mr-2" />{' '}
              {PO_CONSTANTS.GR_BTN_CREATE}
            </Button>
          )}
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {receipts.map(
            (
              gr: GoodsReceipt & { goods_receipt_items?: GoodsReceiptItem[] },
            ) => (
              <div key={gr.id} className="border border-border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-primary flex items-center gap-2">
                    <Link
                      to={`/goods-receipts/${gr.id}`}
                      target="_blank"
                      className="hover:underline text-primary"
                    >
                      {gr.receipt_code}
                    </Link>
                    {gr.linked_yarn_receipt_id ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success-soft text-success">
                        <Icon name="CheckCircle2" size={12} className="mr-1" />
                        Đã tạo phiếu kho
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warning-soft text-warning-foreground">
                        <Icon name="AlertCircle" size={12} className="mr-1" />
                        Chưa tạo phiếu kho
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted">
                      {PO_CONSTANTS.GR_DATE_PREFIX}{' '}
                      {dayjs(gr.received_date).format('DD/MM/YYYY')}
                    </span>
                    {!gr.linked_yarn_receipt_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(
                            `/yarn-receipts?fromGoodsReceipt=${gr.id}`,
                            '_blank',
                          )
                        }
                      >
                        Tạo phiếu kho
                      </Button>
                    )}
                  </div>
                </div>
                <div className="text-sm">
                  {gr.goods_receipt_items?.map((item: GoodsReceiptItem) => (
                    <div
                      key={item.id}
                      className="flex justify-between py-1 border-b border-border/50 last:border-0"
                    >
                      <span>Ref ID: {item.po_item_id}</span>
                      <QuantityText
                        value={item.received_qty}
                        prefix="+"
                        variant="success"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
