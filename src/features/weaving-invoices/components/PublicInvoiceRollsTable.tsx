function formatQty(qty: number | null | undefined): string {
  if (qty === null || qty === undefined) return '0';
  // eslint-disable-next-line no-restricted-syntax
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(qty);
}

type RollItem = {
  roll_number: string;
  weight_kg: number;
  length_m: number | null;
  quality_grade: string | null;
  warehouse_location: string | null;
  lot_number: string | null;
  notes: string | null;
};

type Props = {
  items: RollItem[];
  totalWeightKg: number;
  totalLengthM: number;
  itemCount: number;
};

export function PublicInvoiceRollsTable({
  items,
  totalWeightKg,
  totalLengthM,
  itemCount,
}: Props) {
  return (
    <div className="my-8">
      <h3 className="text-xs font-extrabold text-[#0f3460] uppercase tracking-wider mb-3">
        Chi tiết các cuộn vải gia công ({itemCount} cuộn)
      </h3>

      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full border-collapse text-left text-xs md:text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 bg-slate-50 print:bg-slate-100">
              <th className="p-3 w-12 text-center">STT</th>
              <th className="p-3">Mã cuộn</th>
              <th className="p-3 text-right">Trọng lượng (KG)</th>
              <th className="p-3 text-right">Chiều dài (M)</th>
              <th className="p-3 text-center">Phân loại</th>
              <th className="p-3">Kho/Vị trí</th>
              <th className="p-3">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {items.map((item, idx) => (
              <tr
                key={item.roll_number}
                className="hover:bg-slate-50/50 transition-colors"
              >
                <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                <td className="p-3 font-bold text-slate-800 tracking-wide">
                  {item.roll_number}
                </td>
                <td className="p-3 text-right font-bold">
                  {formatQty(item.weight_kg)} kg
                </td>
                <td className="p-3 text-right">
                  {item.length_m ? `${formatQty(item.length_m)} m` : '—'}
                </td>
                <td className="p-3 text-center">
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      item.quality_grade === 'A'
                        ? 'bg-green-50 text-green-700'
                        : item.quality_grade === 'B'
                          ? 'bg-blue-50 text-blue-700'
                          : item.quality_grade === 'C'
                            ? 'bg-amber-50 text-amber-700'
                            : 'text-slate-400'
                    }`}
                  >
                    {item.quality_grade ?? '—'}
                  </span>
                </td>
                <td className="p-3 truncate max-w-[100px]">
                  {item.warehouse_location || '—'}
                </td>
                <td className="p-3 truncate max-w-[120px] text-slate-400 italic">
                  {item.notes || '—'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 font-bold bg-slate-50/70 text-slate-800">
              <td
                colSpan={2}
                className="p-3 text-right uppercase tracking-wider text-[10px] font-bold"
              >
                Tổng cộng:
              </td>
              <td className="p-3 text-right text-primary font-extrabold text-sm">
                {formatQty(totalWeightKg)} kg
              </td>
              <td className="p-3 text-right font-bold">
                {totalLengthM > 0 ? `${formatQty(totalLengthM)} m` : '—'}
              </td>
              <td colSpan={3} className="p-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
