import { MoneyText, QuantityText } from '@/shared/value';
import { ProgressBar } from '@/shared/components';
import type {
  PurchaseOrder,
  PurchaseOrderItem,
} from '@/domain/purchase-orders';

interface POMaterialsTableProps {
  po: PurchaseOrder;
  globalMaterials: { id: string; name: string; code: string; type: string }[];
}

export function POMaterialsTable({
  po,
  globalMaterials,
}: POMaterialsTableProps) {
  return (
    <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border bg-gray-50/50">
        <h3 className="font-semibold text-lg m-0">Danh sách nguyên liệu</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border text-sm text-muted-foreground bg-gray-50">
              <th className="px-4 py-3 font-semibold w-[25%]">Nguyên liệu</th>
              <th className="px-4 py-3 font-semibold text-right">Đơn giá</th>
              <th className="px-4 py-3 font-semibold text-right">SL Đặt</th>
              <th className="px-4 py-3 font-semibold text-right">Đã nhận</th>
              <th className="px-4 py-3 font-semibold text-right">Còn lại</th>
              <th className="px-4 py-3 font-semibold text-right w-[150px]">
                Tiến độ
              </th>
            </tr>
          </thead>
          <tbody>
            {po.items?.map((item: PurchaseOrderItem) => {
              return (
                <tr
                  key={item.id}
                  className="border-b border-border last:border-0 hover:bg-gray-50/50"
                >
                  <td className="px-4 py-3 text-foreground">
                    {(() => {
                      const mat = globalMaterials.find(
                        (m) => m.id === item.material_id,
                      );
                      if (!mat)
                        return (
                          <span className="font-medium text-xs text-muted-foreground font-mono">
                            {item.material_id}
                          </span>
                        );
                      return (
                        <div className="flex flex-col">
                          <span className="font-semibold">
                            {mat.code} - {mat.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Loại: {mat.type === 'yarn' ? 'Sợi' : 'Vải'}
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <MoneyText value={item.unit_price} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <QuantityText
                      value={item.ordered_qty}
                      suffix={' ' + item.uom}
                    />
                  </td>
                  <td className="px-4 py-3 text-right text-success font-semibold">
                    <QuantityText
                      value={item.received_qty}
                      suffix={' ' + item.uom}
                    />
                  </td>
                  <td className="px-4 py-3 text-right text-warning font-semibold">
                    <QuantityText
                      value={item.remaining_qty}
                      suffix={' ' + item.uom}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-end w-[120px] ml-auto">
                      <ProgressBar
                        value={item.received_qty}
                        max={item.ordered_qty}
                        showLabel
                        size="sm"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
