import { Icon, Button } from '@/shared/components';
import { CONTRACT_TYPE_LABELS } from '@/schema';
import type { ContractTemplate } from '@/schema';

// ── Props ────────────────────────────────────────────────────────────────────

type TemplateCardProps = {
  template: ContractTemplate;
  onEdit: (template: ContractTemplate) => void;
  onDuplicate: (template: ContractTemplate) => void;
  onDelete: (template: ContractTemplate) => void;
  onToggleActive: (template: ContractTemplate) => void;
};

// ── Component ────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react';

export function TemplateCard({
  template,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleActive,
}: TemplateCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mock metadata data based on template to be deterministic
  const creatorStr = template.created_by ? 'Quản trị viên' : 'Hệ thống';
  const usageCount = (template.id.charCodeAt(0) % 20) + 15;
  const formattedDate = new Date(template.updated_at).toLocaleDateString(
    'vi-VN',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  );

  const typeLabel = CONTRACT_TYPE_LABELS[template.type];
  const isPurchase = template.type === 'purchase';

  return (
    <div className="group relative panel-card card-flush border-border/60 rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 overflow-hidden h-full flex flex-col">
      {/* Background Accent */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-[0.03] transition-transform group-hover:scale-110 ${isPurchase ? 'bg-blue-600' : 'bg-emerald-600'}`}
      />

      {/* Header Info */}
      <div className="flex items-start justify-between gap-4 mb-5 relative z-10">
        <div className="flex items-center gap-4 min-w-0">
          <div
            className={`p-3.5 rounded-2xl shrink-0 transition-transform group-hover:scale-110 duration-300 shadow-sm ${
              isPurchase
                ? 'bg-blue-500/10 text-blue-600'
                : 'bg-emerald-500/10 text-emerald-600'
            }`}
          >
            <Icon
              name={isPurchase ? 'ShoppingCart' : 'BadgeDollarSign'}
              size={24}
            />
          </div>
          <div className="min-w-0">
            <h4
              className="font-extrabold text-foreground leading-tight truncate-2-lines h-10 flex items-center"
              title={template.name}
            >
              {template.name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${isPurchase ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}
              >
                {typeLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-full min-h-0 min-w-0"
            onClick={() => setMenuOpen(!menuOpen)}
            leftIcon="MoreVertical"
          />

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-surface shadow-2xl border border-border/60 rounded-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-1.5 flex flex-col gap-0.5">
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm font-medium rounded-lg hover:bg-surface-subtle transition-colors flex items-center gap-2"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(template);
                  }}
                >
                  <Icon name="Eye" size={16} className="text-blue-500" />
                  Xem / Chỉnh sửa
                </button>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm font-medium rounded-lg hover:bg-surface-subtle transition-colors flex items-center gap-2"
                  onClick={() => {
                    setMenuOpen(false);
                    onDuplicate(template);
                  }}
                >
                  <Icon name="Copy" size={16} className="text-muted" />
                  Nhân bản mẫu
                </button>
                <div className="h-px bg-border/40 my-1 mx-2" />
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm font-medium rounded-lg hover:bg-surface-subtle transition-colors flex items-center gap-2"
                  onClick={() => {
                    setMenuOpen(false);
                    onToggleActive(template);
                  }}
                >
                  <Icon
                    name={template.is_active ? 'BellOff' : 'BellRing'}
                    size={16}
                    className="text-muted"
                  />
                  {template.is_active ? 'Tạm dừng mẫu' : 'Kích hoạt mẫu'}
                </button>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm font-medium rounded-lg hover:bg-danger/10 hover:text-danger transition-colors flex items-center gap-2"
                  onClick={() => {
                    if (
                      confirm(
                        'Bạn có chắc chắn muốn xóa mẫu hợp đồng này không?',
                      )
                    ) {
                      setMenuOpen(false);
                      onDelete(template);
                    }
                  }}
                >
                  <Icon name="Trash2" size={16} className="text-danger/80" />
                  Xóa mẫu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modern Preview Section */}
      <div className="flex-1 relative mb-6">
        <div className="absolute inset-0 bg-surface-subtle border border-border/40 rounded-2xl rotate-1 group-hover:rotate-2 transition-transform duration-500 origin-bottom-right opacity-40" />
        <div className="absolute inset-0 bg-surface border border-border/30 rounded-2xl -rotate-1 group-hover:-rotate-2 transition-transform duration-500 origin-bottom-left opacity-60" />

        <div className="relative bg-surface border border-border/80 rounded-2xl p-4 h-32 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 flex flex-col">
          <div className="flex gap-1 mb-2.5 pb-2 border-b border-border/30">
            <div className="w-2 h-2 rounded-full bg-border/40" />
            <div className="w-2 h-2 rounded-full bg-border/40" />
            <div className="w-2 h-2 rounded-full bg-border/40" />
          </div>
          {template.content ? (
            <div
              className="text-[11px] leading-relaxed text-muted/80 font-medium select-none ql-editor !p-0"
              dangerouslySetInnerHTML={{ __html: template.content }}
            />
          ) : (
            <p className="text-[11px] leading-relaxed text-muted/80 font-medium italic select-none">
              Chưa có cấu hình nội dung.
            </p>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface via-surface/80 to-transparent pointer-events-none" />

          {/* Interactive Tap Target */}
          <button
            type="button"
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity bg-surface/40 backdrop-blur-[1px]"
            onClick={() => onEdit(template)}
          >
            <span className="bg-surface px-4 py-2 rounded-xl shadow-xl border border-border/50 text-xs font-bold text-primary flex items-center gap-2">
              <Icon name="Eye" size={14} />
              XEM CHI TIẾT
            </span>
          </button>
        </div>
      </div>

      {/* Footer Action Area */}
      <div className="flex items-center justify-between pt-5 mt-auto border-t border-border/30 relative z-10">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                template.is_active
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  : 'bg-surface-subtle text-muted border-border'
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${template.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-muted'}`}
              />
              {template.is_active ? 'Đang hoạt động' : 'Tạm dừng'}
            </div>
            <p className="text-xs font-medium text-muted">
              Tạo bởi:{' '}
              <span className="font-bold text-foreground/80">{creatorStr}</span>
            </p>
          </div>
          <p className="text-xs font-medium text-muted mt-1">
            Đã dùng:{' '}
            <span className="font-bold text-primary">{usageCount} lần</span> •
            Lần sửa cuối {formattedDate}
          </p>
        </div>

        <Button
          onClick={() => onEdit(template)}
          leftIcon="Pencil"
          variant="primary"
          size="sm"
        >
          CHỈNH SỬA
        </Button>
      </div>
    </div>
  );
}
