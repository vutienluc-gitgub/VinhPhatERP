import {
  ConditionRule,
  ConditionGroup,
  ConditionOperator,
} from '@/domains/approval/utils/expression-evaluator';
import { VPSelect } from '@/shared/components/VPSelect';
import { Input } from '@/shared/components/Input';
import { Icon } from '@/shared/components/Icon';
import { Button } from '@/shared/components/Button';

interface ConditionEditorProps {
  condition: Record<string, unknown> | null;
  onChange: (condition: Record<string, unknown> | null) => void;
}

const OPERATOR_OPTIONS = [
  { value: '==', label: 'Bằng (==)' },
  { value: '!=', label: 'Khác (!=)' },
  { value: '>', label: 'Lớn hơn (>)' },
  { value: '<', label: 'Nhỏ hơn (<)' },
  { value: '>=', label: 'Lớn hơn hoặc bằng (>=)' },
  { value: '<=', label: 'Nhỏ hơn hoặc bằng (<=)' },
];

export function ConditionEditor({ condition, onChange }: ConditionEditorProps) {
  // We assume a simple structure for MVP: { logic: 'AND', rules: [...] }
  const group = condition as unknown as ConditionGroup | null;
  const rules = group?.rules || [];

  const addRule = () => {
    const newRules = [
      ...rules,
      { field: '', operator: '==' as ConditionOperator, value: '' },
    ];
    onChange({ logic: 'AND', rules: newRules } as unknown as Record<
      string,
      unknown
    >);
  };

  const removeRule = (index: number) => {
    const newRules = rules.filter((_, i) => i !== index);
    if (newRules.length === 0) {
      onChange(null);
    } else {
      onChange({ logic: 'AND', rules: newRules } as unknown as Record<
        string,
        unknown
      >);
    }
  };

  const updateRule = (
    index: number,
    field: keyof ConditionRule,
    val: string,
  ) => {
    const newRules = rules.map((r, i) => {
      if (i === index) {
        const rule = r as ConditionRule;

        // Try to parse number if applicable to keep strict typed conditions working better
        let parsedValue: string | number = val;
        if (!isNaN(Number(val)) && val.trim() !== '') {
          parsedValue = Number(val);
        }

        return { ...rule, [field]: field === 'value' ? parsedValue : val };
      }
      return r;
    });
    onChange({ logic: 'AND', rules: newRules } as unknown as Record<
      string,
      unknown
    >);
  };

  return (
    <div className="space-y-3 p-4 border border-default rounded-md bg-surface-secondary">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">
          Điều kiện rẽ nhánh (Tùy chọn)
        </h4>
        <Button variant="outline" size="sm" onClick={addRule}>
          <Icon name="Plus" className="w-4 h-4 mr-1" />
          Thêm điều kiện
        </Button>
      </div>

      {rules.length > 0 && (
        <div className="space-y-2">
          {rules.map((rule, idx) => {
            const r = rule as ConditionRule;
            return (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  className="flex-1"
                  placeholder="Trường dữ liệu (VD: total_amount)"
                  value={r.field}
                  onChange={(e) => updateRule(idx, 'field', e.target.value)}
                />
                <div className="w-[200px]">
                  <VPSelect
                    options={OPERATOR_OPTIONS}
                    value={r.operator}
                    onValueChange={(val) =>
                      updateRule(idx, 'operator', val as string)
                    }
                    placeholder="Phép toán"
                  />
                </div>
                <Input
                  className="flex-1"
                  placeholder="Giá trị (VD: 5000000)"
                  value={String(r.value || '')}
                  onChange={(e) => updateRule(idx, 'value', e.target.value)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRule(idx)}
                  className="text-danger hover:bg-danger-soft shrink-0"
                >
                  <Icon name="Trash2" className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
      {rules.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          Quy trình sẽ luôn đi qua bước này (không có điều kiện rẽ nhánh).
        </p>
      )}
    </div>
  );
}
