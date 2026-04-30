import { useState } from 'react';

import { Icon, Button, SearchInput, Combobox } from '@/shared/components';
import { CONTRACT_TYPE_LABELS, CONTRACT_TEMPLATE_LABELS } from '@/schema';
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
    deleteTemplate,
    toggleTemplate,
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
    const editTemplate = isEdit ? view.template : view.base;

    return (
      <div className="page-container">
        <div className="panel-card card-flush !overflow-visible">
          <div className="card-header-area">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                title="Quay lại"
                leftIcon="ArrowLeft"
              />
              <span className="font-bold text-lg">
                {heading}
                {isEdit && (
                  <span
                    className={`ml-3 px-2 py-0.5 rounded-lg text-xs font-bold align-middle ${view.template.type === 'purchase' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}
                  >
                    {CONTRACT_TYPE_LABELS[view.template.type]}
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="p-4 md:p-6">
            <TemplateEditor
              template={
                editTemplate && editTemplate.id ? editTemplate : undefined
              }
              onSaved={handleSaved}
              onCancel={handleClose}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────

  return (
    <div className="page-container space-y-6 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="fade-up">
          <h1 className="text-2xl md:text-3xl font-extrabold text-text tracking-tight">
            Quản lý mẫu văn bản
          </h1>
          <p className="text-muted text-xs md:text-sm mt-1">
            Thiết lập mẫu hợp đồng tiêu chuẩn để tự động hoá quy trình ký kết
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-surface p-2 rounded-2xl shadow-sm border border-border w-full md:w-auto overflow-visible">
          <div className="w-full sm:w-64">
            <SearchInput
              placeholder={CONTRACT_TEMPLATE_LABELS.SEARCH_PLACEHOLDER}
              value={filter.search}
              onChange={(e) =>
                setFilter((prev) => ({
                  ...prev,
                  search: e.target.value,
                }))
              }
              className="border-none bg-surface-hover w-full"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:w-48 min-w-0">
              <Combobox
                options={[
                  {
                    value: 'all',
                    label: CONTRACT_TEMPLATE_LABELS.ALL_CATEGORIES,
                  },
                  {
                    value: 'sale',
                    label: CONTRACT_TEMPLATE_LABELS.SALE_TEMPLATE,
                  },
                  {
                    value: 'purchase',
                    label: CONTRACT_TEMPLATE_LABELS.PURCHASE_TEMPLATE,
                  },
                ]}
                value={filter.type}
                onChange={(val) =>
                  setFilter((prev) => ({
                    ...prev,
                    type: (val || 'all') as 'all' | ContractType,
                  }))
                }
                placeholder="Phân loại"
                className="border-none bg-surface-hover w-full min-w-0"
              />
            </div>
            <NewTemplateMenu onSelect={handleCreateNew} />
          </div>
        </div>
      </div>

      <div className="panel-card card-flush !overflow-visible">
        {/* Content Section */}
        <div className="p-4 md:p-6">
          {/* Error state */}
          {error && (
            <div className="p-4">
              <p className="error-inline">
                {CONTRACT_TEMPLATE_LABELS.ERROR_PREFIX}
                {error instanceof Error ? error.message : String(error)}
              </p>
            </div>
          )}

          {/* Loading state */}
          {isLoading && <TemplatesLoadingSkeleton />}

          {/* Template list */}
          {!isLoading && !error && (
            <div className="grid gap-4 lg:grid-cols-2">
              {templates.length === 0 && (
                <TemplatesEmptyState onSeed={() => void seedDefaults()} />
              )}

              {templates.length > 0 && filteredTemplates.length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center text-center">
                  <div className="p-4 bg-surface-subtle rounded-xl mb-4">
                    <Icon name="Search" size={32} className="text-muted/50" />
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {CONTRACT_TEMPLATE_LABELS.NO_RESULTS}
                  </p>
                  <p className="text-muted mt-2 text-sm">
                    {CONTRACT_TEMPLATE_LABELS.NO_RESULTS_DESC} &quot;
                    {filter.search}&quot;
                  </p>
                </div>
              )}

              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onEdit={handleEdit}
                  onDuplicate={handleDuplicate}
                  onDelete={(t) => deleteTemplate(t.id)}
                  onToggleActive={toggleTemplate}
                />
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
    <div className="py-12 flex flex-col items-center justify-center text-muted">
      <Icon name="Loader2" size={32} className="animate-spin mb-4" />
      <span className="text-sm">{CONTRACT_TEMPLATE_LABELS.LOADING}</span>
    </div>
  );
}

// ── TemplatesEmptyState ──────────────────────────────────────────────────────

function TemplatesEmptyState({ onSeed }: { onSeed: () => void }) {
  return (
    <div className="col-span-full py-12 flex flex-col items-center text-center">
      <div className="p-4 bg-surface-subtle rounded-full mb-4">
        <Icon name="FileStack" size={32} className="text-primary/70" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">
        {CONTRACT_TEMPLATE_LABELS.EMPTY_TITLE}
      </h3>
      <p className="text-muted text-sm mb-6 max-w-md">
        {CONTRACT_TEMPLATE_LABELS.EMPTY_DESC}
      </p>
      <Button variant="primary" size="lg" leftIcon="Zap" onClick={onSeed}>
        {CONTRACT_TEMPLATE_LABELS.SEED_BUTTON}
      </Button>
    </div>
  );
}
