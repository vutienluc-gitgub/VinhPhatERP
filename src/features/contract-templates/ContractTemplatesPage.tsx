import { useState } from 'react';

import { Icon, SearchInput } from '@/shared/components';
import { CONTRACT_TYPE_LABELS } from '@/schema';
import type { ContractType, ContractTemplate } from '@/schema';
import { useContractTemplates } from '@/application/contracts';

import { TemplateEditor } from './TemplateEditor';
import { TemplateCard } from './TemplateCard';
import { NewTemplateMenu } from './NewTemplateMenu';

// ── View state ───────────────────────────────────────────────────────────────

type EditorView =
  | { mode: 'list' }
  | { mode: 'edit'; template: ContractTemplate }
  | { mode: 'create'; type: ContractType; base?: ContractTemplate };

// ── Component ────────────────────────────────────────────────────────────────

export function ContractTemplatesPage() {
  const {
    templates,
    filteredTemplates,
    isLoading,
    error,
    filter,
    setFilter,
    createTemplate,
    updateTemplate,
    seedDefaults,
  } = useContractTemplates();

  const [view, setView] = useState<EditorView>({ mode: 'list' });

  function handleEdit(template: ContractTemplate) {
    setView({
      mode: 'edit',
      template,
    });
  }

  function handleDuplicate(template: ContractTemplate) {
    setView({
      mode: 'create',
      type: template.type,
      base: {
        ...template,
        id: '',
        name: `${template.name} (Bản sao)`,
      },
    });
  }

  function handleCreateNew(type: ContractType) {
    setView({
      mode: 'create',
      type,
    });
  }

  function handleClose() {
    setView({ mode: 'list' });
  }

  async function handleSaved(data: { name: string; content: string }) {
    if (view.mode === 'create') {
      await createTemplate({
        type: view.type,
        name: data.name,
        content: data.content,
      });
    } else if (view.mode === 'edit') {
      await updateTemplate({
        id: view.template.id,
        data: {
          name: data.name,
          content: data.content,
        },
      });
    }
    handleClose();
  }

  // ── Editor view ──────────────────────────────────────────────────────────

  if (view.mode !== 'list') {
    const isEdit = view.mode === 'edit';
    const heading = isEdit
      ? view.template.name
      : CONTRACT_TYPE_LABELS[view.type];
    const eyebrow = isEdit ? 'ĐIỀU CHỈNH MẪU' : 'KHỞI TẠO CẤU HÌNH';
    const editTemplate = isEdit ? view.template : view.base;

    return (
      <div className="panel-card card-flush max-w-5xl mx-auto border-none shadow-2xl">
        <div className="card-header-area card-header-premium p-6 border-b border-border/50">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="p-2.5 rounded-xl bg-surface-subtle hover:bg-surface-strong border border-border/50 transition-all shadow-sm group"
              onClick={handleClose}
              title="Quay lại"
            >
              <Icon
                name="ArrowLeft"
                size={20}
                className="group-hover:-translate-x-0.5 transition-transform"
              />
            </button>
            <div>
              <p className="eyebrow-premium text-primary/70 mb-1">{eyebrow}</p>
              <h3 className="text-2xl font-extrabold text-foreground tracking-tight">
                {heading}
                {isEdit && (
                  <span className="ml-3 px-2 py-0.5 rounded-lg bg-primary/5 text-xs font-bold text-primary border border-primary/10 align-middle">
                    {CONTRACT_TYPE_LABELS[view.template.type]}
                  </span>
                )}
              </h3>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 bg-surface-strong/30 backdrop-blur-sm">
          <TemplateEditor
            template={
              editTemplate && editTemplate.id ? editTemplate : undefined
            }
            onSaved={handleSaved}
            onCancel={handleClose}
          />
        </div>
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
        <div>
          <div className="flex items-center gap-2 mb-1.5 px-0.5">
            <div className="p-1 rounded-lg bg-blue-600/10 text-blue-600">
              <Icon name="Settings" size={14} strokeWidth={2.5} />
            </div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-blue-600 uppercase">
              QUẢN TRỊ HỆ THỐNG
            </p>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            Mẫu hợp đồng
          </h1>
        </div>
        <NewTemplateMenu onSelect={handleCreateNew} />
      </div>

      <div className="panel-card card-flush border-none shadow-xl overflow-visible">
        {/* Toolbar: Search + Filter */}
        <div className="px-5 md:px-7 py-4 border-b border-border/50 flex flex-wrap items-center gap-3 rounded-t-2xl relative z-10 bg-surface/40 backdrop-blur-sm">
          <div className="flex-1 min-w-[200px]">
            <SearchInput
              placeholder="Tìm kiếm mẫu văn bản..."
              value={filter.search}
              onChange={(e) =>
                setFilter((prev) => ({
                  ...prev,
                  search: e.target.value,
                }))
              }
              className="h-11 shadow-sm border-border/60 focus:border-blue-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Icon name="Filter" size={16} className="text-muted" />
            <select
              className="field-input h-11 text-sm font-semibold shadow-sm border-border/60 pr-10 min-w-[160px]"
              value={filter.type}
              onChange={(e) =>
                setFilter((prev) => ({
                  ...prev,
                  type: e.target.value as 'all' | ContractType,
                }))
              }
            >
              <option value="all">Tất cả danh mục</option>
              <option value="sale">Mẫu Bán hàng</option>
              <option value="purchase">Mẫu Mua hàng</option>
            </select>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 md:p-8">
          {/* Error state */}
          {error && (
            <div className="p-6 rounded-2xl bg-danger/5 border border-danger/20 flex flex-col items-center text-center">
              <div className="p-3 rounded-full bg-danger/10 text-danger mb-3">
                <Icon name="AlertCircle" size={32} />
              </div>
              <h3 className="font-bold text-danger">Không thể tải dữ liệu</h3>
              <p className="text-sm text-danger/80 mt-1 max-w-xs">
                {(error as Error).message}
              </p>
            </div>
          )}

          {/* Loading state */}
          {isLoading && <TemplatesLoadingSkeleton />}

          {/* Template list */}
          {!isLoading && !error && (
            <div className="grid gap-6 lg:grid-cols-2">
              {templates.length === 0 && (
                <TemplatesEmptyState onSeed={() => void seedDefaults()} />
              )}

              {templates.length > 0 && filteredTemplates.length === 0 && (
                <div className="col-span-full py-16 flex flex-col items-center text-center">
                  <div className="p-4 bg-surface-subtle rounded-2xl mb-4">
                    <Icon name="SearchX" size={40} className="text-muted/50" />
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    Không tìm thấy mẫu phù hợp
                  </p>
                  <p className="text-muted mt-2">
                    Dữ liệu không khớp với từ khóa &quot;{filter.search}&quot;
                  </p>
                </div>
              )}

              {filteredTemplates.map((template, idx) => (
                <div
                  key={template.id}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <TemplateCard
                    template={template}
                    onEdit={handleEdit}
                    onDuplicate={handleDuplicate}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── TemplatesLoadingSkeleton ─────────────────────────────────────────────────

function TemplatesLoadingSkeleton() {
  return (
    <div className="py-24 flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon name="FileText" size={24} className="text-primary/40" />
        </div>
      </div>
      <span className="mt-6 text-sm font-bold text-muted tracking-wide animate-pulse uppercase">
        Đang đồng bộ dữ liệu mẫu...
      </span>
    </div>
  );
}

// ── TemplatesEmptyState ──────────────────────────────────────────────────────

function TemplatesEmptyState({ onSeed }: { onSeed: () => void }) {
  return (
    <div className="col-span-full py-20 flex flex-col items-center text-center">
      <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 relative">
        <div className="absolute inset-0 bg-blue-500/5 rounded-3xl animate-ping opacity-20" />
        <Icon name="FileStack" size={40} className="text-blue-600/50" />
      </div>
      <h3 className="text-xl font-extrabold text-foreground mb-2">
        Hệ thống chưa có mẫu văn bản
      </h3>
      <p className="text-muted max-w-sm text-sm leading-relaxed mb-8">
        Khởi tạo các mẫu tiêu chuẩn để bắt đầu quản lý quy trình ký kết tự động.
      </p>
      <button
        type="button"
        className="btn-primary group h-12 px-8 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all rounded-xl font-bold flex items-center gap-3"
        onClick={onSeed}
      >
        <Icon name="Zap" size={18} className="fill-current" />
        Bắt đầu với mẫu tiêu chuẩn
      </button>
    </div>
  );
}
