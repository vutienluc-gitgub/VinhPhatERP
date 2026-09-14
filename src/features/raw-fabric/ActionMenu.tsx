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
  return (
    <>
      {/* Desktop layout */}
      <div className="hidden md:flex items-center gap-2">
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
          className="btn-standard flex items-center min-h-[42px] px-5 gap-[0.4rem]"
          type="button"
          onClick={onNew}
          disabled={isExporting}
        >
          Nhập mới
        </Button>
      </div>

      {/* Mobile layout — shown only on mobile */}
      <div className="flex md:hidden items-center gap-2 w-full">
        {/* Xuất Excel: icon button */}
        <button
          type="button"
          className="btn-icon btn-standard"
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

        {/* Nhập mẻ: icon button */}
        <button
          type="button"
          className="btn-icon btn-standard"
          onClick={onBulkNew}
          disabled={isExporting}
          aria-label="Nhập mẻ"
        >
          <Icon name="Zap" size={20} />
        </button>

        {/* Nhập mới: full-width primary */}
        <Button
          variant="primary"
          leftIcon="Plus"
          className="flex-1 flex items-center justify-center min-h-[42px] gap-[0.4rem]"
          type="button"
          onClick={onNew}
          disabled={isExporting}
        >
          Nhập mới
        </Button>
      </div>
    </>
  );
}
