import { MoneyText } from '@/shared/value';
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
            <tr className="border-b border-border text-sm text-muted bg-gray-50">
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
              const percent = item.ordered_qty
                ? Math.round((item.received_qty / item.ordered_qty) * 100)
                : 0;
              return (
                <tr
                  key={item.id}
                  className="border-b border-border last:border-0 hover:bg-gray-50/50"
                >
                  <td className="px-4 py-3 text-gray-800">
                    {(() => {
                      const mat = globalMaterials.find(
                        (m) => m.id === item.material_id,
                      );
                      if (!mat)
                        return (
                          <span className="font-medium text-xs text-gray-400 font-mono">
                            {item.material_id}
                          </span>
                        );
                      return (
                        <div className="flex flex-col">
                          <span className="font-semibold">
                            {mat.code} - {mat.name}
                          </span>
                          <span className="text-xs text-muted">
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
                    {item.ordered_qty} {item.uom}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
                    {item.received_qty} {item.uom}
                  </td>
                  <td className="px-4 py-3 text-right text-amber-600 font-semibold">
                    {item.remaining_qty} {item.uom}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5 items-end">
                      <span className="text-xs font-bold text-gray-700">
                        {percent}%
                      </span>
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                        <div
                          className={`h-full transition-all ${percent === 0 ? 'bg-gray-300' : percent >= 100 ? 'bg-emerald-500' : 'bg-amber-400'}`}
                          style={{
                            width: `${Math.max(5, Math.min(100, percent))}%`,
                          }}
                        />
                      </div>
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
