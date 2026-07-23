import { LABEL_ORIGIN } from '@/shared/constants/origin.constants';
import type { YarnCatalog } from '@/features/yarn-catalog/types';
import { YARN_CATALOG_MESSAGES as MSG } from '@/features/yarn-catalog/yarn-catalog.constants';
import {
  ActionMenu,
  type ActionMenuItem,
} from '@/shared/components/ActionMenu';

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
  const menuItems: ActionMenuItem[] = [
    {
      label: MSG.BTN_EDIT,
      icon: 'Pencil',
      onClick: () => onEdit(c),
    },
    {
      label: MSG.BTN_DELETE,
      icon: 'Trash2',
      danger: true,
      disabled: isDeleting,
      onClick: () => onDelete(c),
    },
  ];

  return (
    <div className="mobile-card">
      <div className="mobile-card-header items-start">
        <div className="flex flex-col min-w-0 flex-1">
          <span className="mobile-card-title truncate">{c.code}</span>
          <span className="text-sm font-medium truncate">{c.name}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <YarnStatusBadge status={c.status} />
          <ActionMenu
            items={menuItems}
            triggerIcon="MoreVertical"
            placement="left"
          >
            <button className="flex h-11 w-11 items-center justify-center rounded-md hover:bg-surface-subtle text-muted">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>
          </ActionMenu>
        </div>
      </div>
      <div className="mobile-card-body space-y-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div className="flex flex-col">
            <span className="text-xs text-muted">{MSG.LBL_COMPOSITION}</span>
            <span className="font-medium">{c.composition ?? '—'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted">{LABEL_ORIGIN}</span>
            <span className="font-medium">{c.origin ?? '—'}</span>
          </div>
          {c.lot_no && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-muted">{MSG.LBL_LOT_GRADE}</span>
              <div
                className="flex items-center gap-1.5 cursor-pointer bg-surface-secondary px-2 py-1 rounded-md mt-1"
                onClick={() => {
                  // Mở rộng hoặc hiển thị popup sau này nếu cần
                }}
              >
                <span className="font-mono text-primary flex-1 min-w-0 truncate text-sm">
                  {c.lot_no}
                </span>
                {c.grade && (
                  <span className="text-xs bg-muted px-1.5 rounded shrink-0">
                    {c.grade}
                  </span>
                )}
              </div>
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-muted">{MSG.LBL_UNIT}</span>
            <span className="font-medium">{c.unit}</span>
          </div>
        </div>

        {c.notes && (
          <div className="flex items-start gap-2 bg-surface-subtle p-2 rounded text-[12px] text-muted-foreground border-l-2 border-primary/30">
            <span className="font-medium shrink-0">Ghi chú:</span>
            <span className="italic flex-1 line-clamp-2">{c.notes}</span>
          </div>
        )}

        <YarnColorBadge colorName={c.color_name} />
      </div>
    </div>
  );
}
