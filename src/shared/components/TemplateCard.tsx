import type { ContractTemplate } from '@/schema';
import { Icon } from '@/shared/components';
import { CONTRACT_TYPE_LABELS } from '@/schema';

export type TemplateCardProps = {
  template: ContractTemplate;
  onEdit: (template: ContractTemplate) => void;
  onDuplicate: (template: ContractTemplate) => void;
};

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

  // Chuyển HTML thành text cho nội dung xem trước
  const rawText = template.content
    ? template.content
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    : 'Chưa có cấu hình nội dung.';

  return (
    <div
      className="group relative bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col border border-transparent hover:border-blue-100"
      style={{ minHeight: 280 }}
    >
      {/* Background Accent */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-[0.04] transition-transform group-hover:scale-110 ${isPurchase ? 'bg-violet-600' : 'bg-blue-600'}`}
      ></div>

      {/* Header Info */}
      <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
        <div className="flex items-center gap-4 min-w-0">
          <div
            className={`p-3 rounded-xl shrink-0 transition-transform group-hover:scale-110 duration-300 shadow-sm ${
              isPurchase
                ? 'bg-violet-500/10 text-violet-600'
                : 'bg-blue-500/10 text-blue-600'
            }`}
          >
            <Icon name="FileSignature" size={22} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h4
              className="font-extrabold text-foreground leading-tight truncate-2-lines text-base"
              title={template.name}
            >
              {template.name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${isPurchase ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}
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
              : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${template.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}
          ></div>
          {template.is_active ? 'Active' : 'Disabled'}
        </div>
      </div>

      {/* Preview Section */}
      <div className="flex-1 relative mb-5">
        <div className="absolute inset-0 bg-slate-50 border border-slate-100/60 rounded-xl rotate-1 group-hover:rotate-2 transition-transform duration-500 origin-bottom-right opacity-30"></div>
        <div className="absolute inset-0 bg-white border border-slate-200/50 rounded-xl -rotate-1 group-hover:-rotate-2 transition-transform duration-500 origin-bottom-left opacity-50"></div>

        <div className="relative bg-white border border-border/60 rounded-xl p-3 h-24 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 flex flex-col">
          <div className="flex gap-1 mb-2 pb-2 border-b border-slate-50">
            <div className="w-2 h-2 rounded-full bg-slate-100"></div>
            <div className="w-2 h-2 rounded-full bg-slate-100"></div>
            <div className="w-2 h-2 rounded-full bg-slate-100"></div>
          </div>
          <p className="text-[11px] leading-relaxed text-muted/80 font-medium line-clamp-3 whitespace-pre-wrap select-none italic ql-editor">
            {rawText}
          </p>

          {/* Gradient Overlay */}
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />

          {/* Interactive Hover Peek */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
            <button
              className="bg-white px-4 py-2 rounded-xl shadow-xl border border-border/50 text-xs font-bold text-primary flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
              onClick={() => onEdit(template)}
            >
              <Icon name="Eye" size={14} />
              XEM CHI TIẾT
            </button>
          </div>
        </div>
      </div>

      {/* Footer Action Area */}
      <div className="flex items-center justify-between pt-4 mt-auto border-t border-slate-50 relative z-10">
        <div className="flex flex-col">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">
            Last Modification
          </p>
          <p className="text-xs font-extrabold text-slate-600">
            {formattedDate}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100 active:scale-90"
            onClick={() => onDuplicate(template)}
            title="Duplicate Template"
          >
            <Icon name="Copy" size={17} />
          </button>
          <button
            type="button"
            className="h-9 px-4 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs rounded-lg transition-all shadow-lg shadow-slate-900/10 hover:shadow-blue-600/20 active:scale-95 flex items-center gap-2 group/btn"
            onClick={() => onEdit(template)}
          >
            <Icon
              name="Pencil"
              size={13}
              className="group-hover/btn:rotate-12 transition-transform"
            />
            EDIT
          </button>
        </div>
      </div>
    </div>
  );
}
