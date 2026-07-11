import { Icon } from '@/shared/components/Icon';
import { LABEL_ORIGIN } from '@/shared/constants/origin.constants';
import type { YarnCatalog } from '@/features/yarn-catalog/types';

import { YarnColorBadge } from './YarnColorBadge';
import { YarnStatusBadge } from './YarnStatusBadge';

interface YarnCatalogMobileCardProps {
  catalog: YarnCatalog;
  onEdit: (catalog: YarnCatalog) => void;
  onDelete: (catalog: YarnCatalog) => void;
  isDeleting: boolean;
}

export function YarnCatalogMobileCard({
  catalog: c,
  onEdit,
  onDelete,
  isDeleting,
}: YarnCatalogMobileCardProps) {
  return (
    <div className="mobile-card">
      <div className="mobile-card-header">
        <div className="flex flex-col">
          <span className="mobile-card-title">{c.code}</span>
          <span className="text-sm font-medium">{c.name}</span>
        </div>
        <YarnStatusBadge status={c.status} />
      </div>
      <div className="mobile-card-body space-y-2">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div className="flex flex-col">
            <span className="text-xs text-muted">Thành phần</span>
            <span className="font-medium">{c.composition ?? '—'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted">{LABEL_ORIGIN}</span>
            <span className="font-medium">{c.origin ?? '—'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted">Mã lô / Loại</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-primary">{c.lot_no}</span>
              {c.grade && (
                <span className="text-xs bg-muted px-1.5 rounded">
                  {c.grade}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted">Đơn vị</span>
            <span className="font-medium">{c.unit}</span>
          </div>
        </div>
        {c.notes && (
          <div className="bg-surface-subtle p-2 rounded text-[11px] text-muted-foreground border-l-2 border-primary/30 italic">
            {c.notes}
          </div>
        )}
        <YarnColorBadge colorName={c.color_name} />
        <div className="flex gap-2 pt-2 border-t border-border/10">
          <button
            className="btn-secondary flex-1 text-primary"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(c);
            }}
          >
            <Icon name="Pencil" size={16} /> Sửa
          </button>
          <button
            className="btn-secondary text-danger px-3"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(c);
            }}
            disabled={isDeleting}
          >
            <Icon name="Trash2" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
