import { useTemplateRevisions, type PrintTemplateEntity } from '@/domain/print';
import { Button, Icon } from '@/shared/components';

interface TemplateVersionHistoryModalProps {
  template: PrintTemplateEntity | null;
  isOpen: boolean;
  onClose: () => void;
  onRollback: (snapshot: PrintTemplateEntity) => void;
}

export function TemplateVersionHistoryModal({
  template,
  isOpen,
  onClose,
  onRollback,
}: TemplateVersionHistoryModalProps) {
  const { data: revisions = [], isLoading } = useTemplateRevisions(
    template?.id,
  );

  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[85vh] bg-surface rounded-2xl border border-default shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-default bg-surface-secondary/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Icon name="RotateCcw" size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">
                Lịch Sử Phiên Bản: {template.name}
              </h3>
              <span className="text-xs text-muted font-mono">
                Mã mẫu: {template.code} • Phiên bản hiện tại: rev.
                {template.revision}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-muted hover:text-foreground flex items-center justify-center"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Revisions List */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <div className="h-14 bg-surface-secondary rounded animate-pulse" />
              <div className="h-14 bg-surface-secondary rounded animate-pulse" />
            </div>
          ) : revisions.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-2 border border-dashed border-default rounded-2xl">
              <Icon name="History" size={24} className="text-muted/60" />
              <span className="text-sm font-semibold text-foreground">
                Chưa có bản lưu lịch sử nào cho mẫu này
              </span>
              <span className="text-xs text-muted">
                Mỗi lần bạn nhấn "Lưu Bản Thiết Kế" trong Designer, một bản ghi
                lịch sử sẽ được tạo tại đây.
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {revisions.map((rev) => {
                const isCurrent = rev.revision === template.revision;

                return (
                  <div
                    key={rev.id}
                    className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-colors ${
                      isCurrent
                        ? 'border-primary bg-primary/5'
                        : 'border-default bg-surface hover:bg-surface-secondary/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center font-mono text-xs font-bold text-primary">
                        r{rev.revision}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">
                            {rev.note || `Bản sửa đổi rev.${rev.revision}`}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-primary text-primary-foreground">
                              Hiện Tại
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted font-mono">
                          {rev.createdAt.slice(0, 19).replace('T', ' ')} •{' '}
                          {rev.savedBy} •{' '}
                          {rev.templateSnapshot.layout.blocks.length} khối
                        </span>
                      </div>
                    </div>

                    {!isCurrent && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onRollback(rev.templateSnapshot);
                          onClose();
                        }}
                        className="text-xs font-semibold gap-1"
                      >
                        <Icon name="RotateCcw" size={13} />
                        Khôi Phục Bản Này
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 border-t border-default flex justify-end bg-surface">
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
