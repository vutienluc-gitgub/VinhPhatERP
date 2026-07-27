import { useMemo } from 'react';
import DOMPurify from 'dompurify';

import { Icon, useConfirm, Badge, ActionMenu } from '@/shared/components';
import {
  CONTRACT_TYPE_LABELS,
  CONTRACT_TEMPLATE_LABELS,
  type ContractTemplate,
} from '@/schema';

// ── Props ────────────────────────────────────────────────────────────────────

type TemplateCardProps = {
  template: ContractTemplate;
  onEdit: (template: ContractTemplate) => void;
  onDuplicate: (template: ContractTemplate) => void;
  onDelete: (template: ContractTemplate) => void;
  onToggleActive: (template: ContractTemplate) => void;
};

// ── Component ────────────────────────────────────────────────────────────────

export function TemplateCard({
  template,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleActive,
}: TemplateCardProps) {
  const { confirm } = useConfirm();

  const sanitizedContent = useMemo(
    () => (template.content ? DOMPurify.sanitize(template.content) : ''),
    [template.content],
  );

  const formattedDate = useMemo(
    () =>
      new Date(template.updated_at).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
    [template.updated_at],
  );

  const typeLabel = CONTRACT_TYPE_LABELS[template.type];
  const isPurchase = template.type === 'purchase';

  return (
    <div className="group relative panel-card card-flush border-border/60 rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 h-full flex flex-col !overflow-visible">
      {/* Background Accent - isolated to not clip menus */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
        <div
          className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-[0.03] transition-transform group-hover:scale-110 ${isPurchase ? 'bg-info-soft' : 'bg-success-soft'}`}
        />
      </div>

      {/* Header Info */}
      <div className="flex items-start justify-between gap-4 mb-5 relative z-10">
        <div className="flex items-center gap-4 min-w-0">
          <div
            className={`p-3.5 rounded-2xl shrink-0 transition-transform group-hover:scale-110 duration-300 shadow-sm ${
              isPurchase
                ? 'bg-info-soft/10 text-info'
                : 'bg-success-soft/10 text-success'
            }`}
          >
            <Icon
              name={isPurchase ? 'ShoppingCart' : 'BadgeDollarSign'}
              size={24}
            />
          </div>
          <div className="min-w-0">
            <h4
              className="font-extrabold text-foreground leading-tight line-clamp-2"
              title={template.name}
            >
              {template.name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${isPurchase ? 'bg-info-soft text-info' : 'bg-success-soft text-success'}`}
              >
                {typeLabel}
              </span>
            </div>
          </div>
        </div>

        <ActionMenu
          items={[
            {
              label: CONTRACT_TEMPLATE_LABELS.MENU_EDIT,
              icon: 'Eye',
              iconClass: 'text-info',
              onClick: () => onEdit(template),
            },
            {
              label: CONTRACT_TEMPLATE_LABELS.MENU_DUPLICATE,
              icon: 'Copy',
              onClick: () => onDuplicate(template),
            },
            {
              label: template.is_active
                ? CONTRACT_TEMPLATE_LABELS.MENU_PAUSE
                : CONTRACT_TEMPLATE_LABELS.MENU_ACTIVATE,
              icon: template.is_active ? 'PauseCircle' : 'PlayCircle',
              separated: true,
              onClick: () => onToggleActive(template),
            },
            {
              label: CONTRACT_TEMPLATE_LABELS.MENU_DELETE,
              icon: 'Trash2',
              danger: true,
              onClick: async () => {
                const isConfirmed = await confirm({
                  title: CONTRACT_TEMPLATE_LABELS.CONFIRM_DELETE_TITLE,
                  message: CONTRACT_TEMPLATE_LABELS.CONFIRM_DELETE_MSG,
                  confirmLabel: CONTRACT_TEMPLATE_LABELS.BTN_DELETE,
                  cancelLabel: CONTRACT_TEMPLATE_LABELS.BTN_CANCEL,
                  variant: 'danger',
                });
                if (isConfirmed) {
                  onDelete(template);
                }
              },
            },
          ]}
        />
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
          {sanitizedContent ? (
            <div
              className="text-[11px] leading-relaxed text-muted/80 font-medium select-none ql-editor !p-0"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          ) : (
            <p className="text-[11px] leading-relaxed text-muted/80 font-medium italic select-none">
              {CONTRACT_TEMPLATE_LABELS.NO_CONTENT}
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
              {CONTRACT_TEMPLATE_LABELS.VIEW_DETAIL}
            </span>
          </button>
        </div>
      </div>

      {/* Footer Action Area */}
      <div className="flex items-center justify-between pt-5 mt-auto border-t border-border/30 relative z-10">
        <div className="flex flex-col gap-1 w-full">
          <div className="flex items-center justify-between gap-3 w-full">
            <Badge variant={template.is_active ? 'success' : 'gray'}>
              {template.is_active
                ? CONTRACT_TEMPLATE_LABELS.STATUS_ACTIVE
                : CONTRACT_TEMPLATE_LABELS.STATUS_PAUSED}
            </Badge>
            <p className="text-xs font-medium text-muted whitespace-nowrap">
              {CONTRACT_TEMPLATE_LABELS.UPDATED_AT}
              {formattedDate}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
