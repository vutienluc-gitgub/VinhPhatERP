import dayjs from 'dayjs';

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
          Lịch sử Nhập Kho (Goods Receipts)
        </h3>
      </div>
      {receipts.length === 0 ? (
        <div className="p-16 flex flex-col items-center justify-center text-center bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-xl m-4">
          <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mb-5 text-gray-400">
            <Icon name="PackageOpen" size={40} />
          </div>
          <h4 className="text-xl font-bold text-gray-800 mb-2">
            Chưa có phiếu nhập kho
          </h4>
          <p className="text-base text-gray-500 max-w-md mb-8">
            Đơn hàng này chưa có dữ liệu nhập kho. Hãy tạo phiếu nhập kho khi
            hàng được giao đến để ghi nhận công nợ và tồn kho.
          </p>
          {(po.status === 'approved' || po.status === 'partial_received') && (
            <Button
              variant="primary"
              size="lg"
              className="shadow-sm px-6"
              onClick={onOpenForm}
            >
              <Icon name="Plus" size={20} className="mr-2" /> Tạo phiếu nhập kho
              ngay
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
                  <span className="font-semibold text-primary">
                    {gr.receipt_code}
                  </span>
                  <span className="text-sm text-muted">
                    Ngày nhập: {dayjs(gr.received_date).format('DD/MM/YYYY')}
                  </span>
                </div>
                <div className="text-sm">
                  {gr.goods_receipt_items?.map((item: GoodsReceiptItem) => (
                    <div
                      key={item.id}
                      className="flex justify-between py-1 border-b border-border/50 last:border-0"
                    >
                      <span>Ref ID: {item.po_item_id}</span>
                      <span className="font-medium text-green-600">
                        +{item.received_qty}
                      </span>
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
