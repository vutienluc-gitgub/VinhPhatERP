import { useRef, useState, useEffect } from 'react';

import { Button } from '@/shared/components';
import { Icon } from '@/shared/components/Icon';

interface ActionMenuProps {
  onNew: () => void;
  onBulkNew: () => void;
  onExport: () => void;
  isExporting: boolean;
}

export function ActionMenu({
  onNew,
  onBulkNew,
  onExport,
  isExporting,
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <>
      {/* Desktop layout */}
      <div className="flex items-center gap-2">
        {/* Xuất Excel: icon-only with tooltip */}
        <div className="relative group">
          <button
            type="button"
            className="btn-icon focus:outline-none"
            onClick={onExport}
            disabled={isExporting}
            aria-label="Xuất Excel"
          >
            {isExporting ? (
              <Icon name="Loader2" size={20} className="animate-spin" />
            ) : (
              <Icon name="FileSpreadsheet" size={20} />
            )}
          </button>
          <div className="absolute right-0 top-full mt-1 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-foreground text-background text-xs rounded px-2 py-1 whitespace-nowrap">
              Xuất Excel (tất cả kết quả hiện tại)
            </div>
          </div>
        </div>

        {/* Nhập mẻ: secondary */}
        <Button
          variant="secondary"
          leftIcon="Zap"
          className="btn-standard"
          type="button"
          onClick={onBulkNew}
          disabled={isExporting}
        >
          Nhập mẻ
        </Button>

        {/* Nhập mới: primary (rightmost) */}
        <Button
          variant="primary"
          leftIcon="Plus"
          className="btn-standard"
          type="button"
          onClick={onNew}
          disabled={isExporting}
          style={{
            minHeight: 42,
            padding: '0 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          Nhập mới
        </Button>
      </div>

      {/* Mobile layout — hidden on desktop */}
      <div className="hidden items-center gap-2 w-full">
        {/* ... dropdown menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="btn-icon btn-standard"
            onClick={() => setOpen((v) => !v)}
            disabled={isExporting}
            aria-label="Thêm hành động"
          >
            <Icon name="MoreHorizontal" size={20} />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-surface border border-border rounded-lg shadow-lg min-w-[160px] py-1">
              <button
                type="button"
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-surface-subtle disabled:opacity-50"
                onClick={() => {
                  setOpen(false);
                  onBulkNew();
                }}
                disabled={isExporting}
              >
                <Icon name="Zap" size={16} /> Nhập mẻ
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-surface-subtle disabled:opacity-50"
                onClick={() => {
                  setOpen(false);
                  onExport();
                }}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Icon name="Loader2" size={16} className="animate-spin" />
                ) : (
                  <Icon name="FileSpreadsheet" size={16} />
                )}
                Xuất Excel
              </button>
            </div>
          )}
        </div>

        {/* Nhập mới: full-width primary */}
        <Button
          variant="primary"
          leftIcon="Plus"
          className="flex-1"
          type="button"
          onClick={onNew}
          disabled={isExporting}
          style={{
            minHeight: 42,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
          }}
        >
          Nhập mới
        </Button>
      </div>
    </>
  );
}
