import { Icon } from '@/shared/components';
import { CONTRACT_TYPE_LABELS } from '@/schema';
import type { ContractTemplate } from '@/schema';

// ── Props ────────────────────────────────────────────────────────────────────

type TemplateCardProps = {
  template: ContractTemplate;
  onEdit: (template: ContractTemplate) => void;
  onDuplicate: (template: ContractTemplate) => void;
};

// ── Component ────────────────────────────────────────────────────────────────

export function TemplateCard({
  template,
  onEdit,
  onDuplicate,
}: TemplateCardProps) {
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

  const rawText = template.content
    ? template.content
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    : 'Chưa có cấu hình nội dung.';

  return (
    <div className="group relative panel-card card-flush border-border/60 rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 overflow-hidden h-full flex flex-col">
      {/* Background Accent */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-[0.03] transition-transform group-hover:scale-110 ${isPurchase ? 'bg-violet-600' : 'bg-blue-600'}`}
      />

      {/* Header Info */}
      <div className="flex items-start justify-between gap-4 mb-5 relative z-10">
        <div className="flex items-center gap-4 min-w-0">
          <div
            className={`p-3.5 rounded-2xl shrink-0 transition-transform group-hover:scale-110 duration-300 shadow-sm ${
              isPurchase
                ? 'bg-violet-500/10 text-violet-600'
                : 'bg-blue-500/10 text-blue-600'
            }`}
          >
            <Icon name="FileSignature" size={24} strokeWidth={2} />
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
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${isPurchase ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}
              >
                {typeLabel}
              </span>
            </div>
          </div>
        </div>

        <div
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-black uppercase tracking-wide transition-colors ${
            template.is_active
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-500/10'
              : 'bg-surface-subtle text-muted border-border'
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${template.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-muted'}`}
          />
          {template.is_active ? 'Đang hoạt động' : 'Tạm dừng'}
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
          <p className="text-[11px] leading-relaxed text-muted/80 font-medium line-clamp-4 whitespace-pre-wrap select-none italic ql-editor">
            {rawText}
          </p>

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
        <div className="flex flex-col">
          <p className="text-[10px] font-bold text-muted uppercase tracking-tighter mb-0.5">
            Lần sửa cuối
          </p>
          <p className="text-xs font-extrabold text-foreground/70">
            {formattedDate}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="w-11 h-11 flex items-center justify-center rounded-xl text-muted hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100 active:scale-90"
            onClick={() => onDuplicate(template)}
            title="Nhân bản mẫu"
          >
            <Icon name="Copy" size={18} />
          </button>
          <button
            type="button"
            className="h-11 px-5 bg-foreground hover:bg-primary text-surface font-bold text-xs rounded-xl transition-all shadow-lg shadow-foreground/10 hover:shadow-primary/20 active:scale-95 flex items-center gap-2 group/btn"
            onClick={() => onEdit(template)}
          >
            <Icon
              name="Pencil"
              size={14}
              className="group-hover/btn:rotate-12 transition-transform"
            />
            CHỈNH SỬA
          </button>
        </div>
      </div>
    </div>
  );
}
