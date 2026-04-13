import { useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Icon } from '@/shared/components';
import { CONTRACT_TYPE_LABELS } from '@/schema';

import { getTemplates } from './contract-templates.module';
import type { ContractTemplate } from './contract-templates.module';
import { TemplateEditor } from './TemplateEditor';

// ── Component ────────────────────────────────────────────────────────────────

export function ContractTemplatesPage() {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] =
    useState<ContractTemplate | null>(null);

  const {
    data: templates = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['contract-templates'],
    queryFn: getTemplates,
  });

  function handleEdit(template: ContractTemplate) {
    setSelectedTemplate(template);
  }

  function handleClose() {
    setSelectedTemplate(null);
  }

  function handleSaved(updated: ContractTemplate) {
    queryClient.setQueryData<ContractTemplate[]>(
      ['contract-templates'],
      (old) => (old ?? []).map((t) => (t.id === updated.id ? updated : t)),
    );
    setSelectedTemplate(null);
    toast.success('Mau hop dong da duoc cap nhat.');
  }

  if (selectedTemplate) {
    return (
      <div className="panel-card card-flush">
        <div className="card-header-area card-header-premium">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn-ghost p-2 rounded-lg"
              onClick={handleClose}
              title="Quay lai"
            >
              <Icon name="ArrowLeft" size={20} />
            </button>
            <div>
              <p className="eyebrow-premium">CHINH SUA MAU</p>
              <h3 className="title-premium">
                {selectedTemplate.name}
                <span className="ml-2 text-sm font-normal text-muted">
                  ({CONTRACT_TYPE_LABELS[selectedTemplate.type]})
                </span>
              </h3>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <TemplateEditor
            template={selectedTemplate}
            onSaved={handleSaved}
            onCancel={handleClose}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">QUAN TRI HE THONG</p>
          <h3 className="title-premium">Mau Hop Dong</h3>
        </div>
      </div>

      {/* Description */}
      <div className="p-4 md:p-6 border-b border-border">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/15">
          <Icon
            name="Info"
            size={18}
            className="text-primary shrink-0 mt-0.5"
          />
          <div className="text-sm text-muted">
            <p className="font-medium text-foreground mb-1">
              Quan ly mau hop dong
            </p>
            <p>
              Chinh sua noi dung HTML cua tung loai hop dong. Cac thay doi chi
              anh huong den hop dong duoc tao sau khi luu. Hop dong da tao truoc
              do giu nguyen noi dung goc.
            </p>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4">
          <p className="error-inline">
            Loi tai du lieu: {(error as Error).message}
          </p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="p-8 flex items-center justify-center">
          <div className="flex items-center gap-3 text-muted">
            <Icon name="Loader" size={20} className="animate-spin" />
            <span>Dang tai danh sach mau...</span>
          </div>
        </div>
      )}

      {/* Template list */}
      {!isLoading && !error && (
        <div className="p-4 md:p-6 grid gap-4 md:grid-cols-2">
          {templates.length === 0 && (
            <div className="col-span-2 py-16 text-center">
              <Icon
                name="FileText"
                size={48}
                className="text-muted/30 mx-auto mb-4"
              />
              <p className="text-muted">Chua co mau hop dong nao.</p>
              <p className="text-xs text-muted mt-1">
                Vui long kiem tra ket noi co so du lieu hoac tao mau trong
                database.
              </p>
            </div>
          )}

          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── TemplateCard ─────────────────────────────────────────────────────────────

type TemplateCardProps = {
  template: ContractTemplate;
  onEdit: (template: ContractTemplate) => void;
};

function TemplateCard({ template, onEdit }: TemplateCardProps) {
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
    <div className="panel-card p-5 flex flex-col gap-4 hover:border-primary/40 transition-colors cursor-default">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`p-2.5 rounded-lg shrink-0 ${
              isPurchase
                ? 'bg-violet-500/10 text-violet-500'
                : 'bg-primary/10 text-primary'
            }`}
          >
            <Icon name="FileText" size={20} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">
              {template.name}
            </p>
            <p
              className={`text-xs font-medium mt-0.5 ${
                isPurchase ? 'text-violet-500' : 'text-primary'
              }`}
            >
              {typeLabel}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${
            template.is_active
              ? 'bg-success/10 text-success border-success/20'
              : 'bg-muted/10 text-muted border-muted/20'
          }`}
        >
          {template.is_active ? 'Dang dung' : 'Khong dung'}
        </span>
      </div>

      {/* Preview snippet */}
      <div className="bg-surface-subtle rounded-lg p-3 text-xs text-muted font-mono line-clamp-3 border border-border/50 leading-relaxed">
        {template.content
          ? template.content
              .replace(/<[^>]+>/g, ' ')
              .trim()
              .slice(0, 200) + '...'
          : 'Chua co noi dung.'}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-muted">Cap nhat: {formattedDate}</p>
        <button
          type="button"
          className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1.5"
          onClick={() => onEdit(template)}
        >
          <Icon name="Pencil" size={14} />
          Chinh sua
        </button>
      </div>
    </div>
  );
}
