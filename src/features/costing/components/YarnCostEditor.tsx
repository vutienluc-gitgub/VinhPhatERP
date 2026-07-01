import { MoneyText } from '@/shared/value';
import type { CostingYarnItem } from '@/features/costing/types/greige-costing.type';

interface YarnCostEditorProps {
  items: CostingYarnItem[];
  onChange: (id: string, updates: Partial<CostingYarnItem>) => void;
}

export function YarnCostEditor({ items, onChange }: YarnCostEditorProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold mb-2">
        Đơn giá sợi thành phần (VNĐ/kg)
      </h4>
      {items.map((item) => (
        <div
          key={item.id}
          className="flex flex-col sm:flex-row gap-3 items-center p-3 border border-border/50 rounded bg-surface"
        >
          <div className="flex-1">
            <p className="text-sm font-medium">{item.yarn_code}</p>
            <p className="text-xs text-muted truncate max-w-[200px]">
              {item.yarn_name}
            </p>
            <p className="text-xs text-info mt-1">
              Định mức: {item.consumption_kg_per_m.toFixed(3)} kg/m
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
            <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
              <input
                type="checkbox"
                className="rounded border-border text-primary focus:ring-primary/20"
                checked={item.is_override}
                onChange={(e) => {
                  onChange(item.id, {
                    is_override: e.target.checked,
                    override_price: e.target.checked ? item.base_price : null,
                  });
                }}
              />
              Ghi đè giá thủ công
            </label>

            {item.is_override ? (
              <input
                type="number"
                className="field-input text-sm w-32 text-right"
                value={item.override_price ?? ''}
                onChange={(e) =>
                  onChange(item.id, { override_price: Number(e.target.value) })
                }
                placeholder="Nhập giá mới..."
                min="0"
              />
            ) : (
              <div className="field-input text-sm w-32 bg-muted/10 text-right cursor-not-allowed">
                <MoneyText value={item.base_price} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
