import type { CostBreakdownItem } from '@/features/costing/types/greige-costing.type';

interface CostBreakdownTableProps {
  breakdown: CostBreakdownItem[];
  totalCost: number;
}

export function CostBreakdownTable({
  breakdown,
  totalCost,
}: CostBreakdownTableProps) {
  if (breakdown.length === 0) return null;

  return (
    <div className="bg-surface rounded border border-border/50 overflow-hidden">
      <div className="px-4 py-2 bg-muted/20 border-b border-border/50 text-sm font-semibold">
        Cơ cấu giá vốn
      </div>
      <table className="w-full text-sm">
        <thead className="text-muted text-xs text-left">
          <tr>
            <th className="p-3 font-normal">Thành phần</th>
            <th className="p-3 font-normal text-right">Tỷ lệ</th>
            <th className="p-3 font-normal text-right">Giá trị (VNĐ)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {breakdown.map((item) => (
            <tr key={item.key}>
              <td className="p-3 font-medium text-foreground">{item.label}</td>
              <td className="p-3 text-right text-muted">
                {item.percentage.toFixed(1)}%
              </td>
              <td className="p-3 text-right">{item.amount.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-muted/10 font-bold">
          <tr>
            <td className="p-3">Tổng giá vốn (Total Cost)</td>
            <td className="p-3 text-right">100%</td>
            <td className="p-3 text-right text-primary">
              {totalCost.toLocaleString()}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
