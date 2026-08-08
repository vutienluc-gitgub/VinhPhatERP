import { MoneyText } from '@/shared/value';
import type { CostingYarnItem } from '@/features/costing/types/greige-costing.type';
import { COSTING_LABELS } from '@/features/costing/costing.constants';

interface YarnCostEditorProps {
  items: CostingYarnItem[];
  onChange: (id: string, updates: Partial<CostingYarnItem>) => void;
}

export function YarnCostEditor({ items, onChange }: YarnCostEditorProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold mb-2">
        {COSTING_LABELS.YARN_COST_TITLE}
      </h4>
      {items.map((item) => (
        <div
          key={item.id}
          className="flex flex-col sm:flex-row gap-3 items-center p-3 border border-border/50 rounded bg-surface"
        >
          <div className="flex-1">
            <p className="text-sm font-medium">{item.yarn_code}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {item.yarn_name}
            </p>
            <p className="text-xs text-info mt-1">
              {COSTING_LABELS.CONSUMPTION}
              {item.consumption_kg_per_m.toFixed(3)}
              {COSTING_LABELS.KG_PER_M}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
            <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
              <input
                type="checkbox"
                className="rounded border-border text-foreground focus:ring-primary/20"
                checked={item.is_override}
                onChange={(e) => {
                  onChange(item.id, {
                    is_override: e.target.checked,
                    override_price: e.target.checked ? item.base_price : null,
                  });
                }}
              />
              {COSTING_LABELS.OVERRIDE_PRICE_MANUAL}
            </label>

            {item.is_override ? (
              <input
                type="number"
                className="field-input text-sm w-32 text-right"
                value={item.override_price ?? ''}
                onChange={(e) =>
                  onChange(item.id, { override_price: Number(e.target.value) })
                }
                placeholder={COSTING_LABELS.ENTER_NEW_PRICE}
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
