import { useState } from 'react';

import {
  FIELD_REGISTRY,
  type DocumentType,
  type FieldDefinition,
} from '@/domain/print';
import { Icon } from '@/shared/components';

interface VariablePickerProps {
  documentType: DocumentType;
  onInsertVariable: (variableKey: string) => void;
}

export function VariablePicker({
  documentType,
  onInsertVariable,
}: VariablePickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const fields = FIELD_REGISTRY.filter(
    (f) => f.documentType === documentType || f.category === 'company',
  );

  const categories = [
    { id: 'all', label: 'Tất cả' },
    { id: 'company', label: 'Doanh nghiệp' },
    { id: 'document', label: 'Chứng từ' },
    { id: 'customer', label: 'Khách hàng' },
    { id: 'totals', label: 'Tổng số' },
  ];

  const filteredFields = fields.filter(
    (f) => activeCategory === 'all' || f.category === activeCategory,
  );

  return (
    <div className="flex flex-col gap-2 p-3 bg-surface-secondary/50 rounded-xl border border-default">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
          <Icon name="Tag" size={13} className="text-primary" />
          Biến Dữ Liệu Tự Động
        </span>
        <span className="text-[10px] text-muted">Click để chèn</span>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium shrink-0 transition-colors ${
              activeCategory === cat.id
                ? 'bg-primary text-primary-foreground font-bold'
                : 'bg-surface text-muted hover:text-foreground border border-default'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Field Tags List */}
      <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pt-1">
        {filteredFields.map((field: FieldDefinition) => (
          <button
            key={field.id}
            type="button"
            onClick={() => onInsertVariable(`{{${field.id}}}`)}
            title={`Chèn biến ${field.id} (${field.label})`}
            className="px-2 py-1 rounded bg-surface hover:bg-primary/10 border border-default hover:border-primary/40 text-[10px] text-foreground text-left flex items-center gap-1 transition-colors"
          >
            <span className="font-mono text-primary font-bold">{`{{${field.id}}}`}</span>
            <span className="text-muted text-[9px]">({field.label})</span>
          </button>
        ))}
      </div>
    </div>
  );
}
