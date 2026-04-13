import { useState } from 'react';

import { Icon, Button } from '@/shared/components';
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
    const eyebrow = isEdit ? 'ĐIỀU CHỈNH MẪU' : 'KHỞI TẠO CẤU HÌNH';
    const editTemplate = isEdit ? view.template : view.base;

    return (
      <div className="panel-card card-flush">
        <div className="card-header-area card-header-premium">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              title="Quay lại"
              leftIcon="ArrowLeft"
            />
            <div>
              <p className="eyebrow-premium">{eyebrow}</p>
              <h3 className="title-premium">
                {heading}
                {isEdit && (
                  <span
                    className={`ml-3 px-2 py-0.5 rounded-lg text-xs font-bold align-middle ${view.template.type === 'purchase' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}
                  >
                    {CONTRACT_TYPE_LABELS[view.template.type]}
                  </span>
                )}
              </h3>
            </div>
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
    );
  }

  // ── List view ────────────────────────────────────────────────────────────

  return (
    <div className="panel-card card-flush">
      {/* Header Area */}
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">QUẢN TRỊ HỆ THỐNG</p>
          <h3 className="title-premium">Mẫu hợp đồng</h3>
        </div>
        <NewTemplateMenu onSelect={handleCreateNew} />
      </div>

      {/* Toolbar: Search + Filter */}
      <div className="filter-bar card-filter-section p-4 border-b border-border">
        <div className="filter-compact-premium">
          <div className="filter-field">
            <label htmlFor="template-search">Tìm kiếm</label>
            <div className="search-input-wrapper">
              <input
                id="template-search"
                className="field-input"
                type="text"
                placeholder="Tìm kiếm mẫu văn bản..."
                value={filter.search}
                onChange={(e) =>
                  setFilter((prev) => ({
                    ...prev,
                    search: e.target.value,
                  }))
                }
              />
              <Icon name="Search" size={16} className="search-input-icon" />
            </div>
          </div>
          <div className="filter-field">
            <label>Loại danh mục</label>
            <select
              className="field-input"
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
      </div>

      {/* Content Section */}
      <div className="p-4 md:p-6">
        {/* Error state */}
        {error && (
          <div className="p-4">
            <p className="error-inline">Lỗi: {(error as Error).message}</p>
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
                  Không tìm thấy mẫu phù hợp
                </p>
                <p className="text-muted mt-2 text-sm">
                  Dữ liệu không khớp với từ khóa &quot;{filter.search}&quot;
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
  );
}

// ── TemplatesLoadingSkeleton ─────────────────────────────────────────────────

function TemplatesLoadingSkeleton() {
  return (
    <div className="py-12 flex flex-col items-center justify-center text-muted">
      <Icon name="Loader2" size={32} className="animate-spin mb-4" />
      <span className="text-sm">Đang tải dữ liệu mẫu...</span>
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
        Hệ thống chưa có mẫu văn bản
      </h3>
      <p className="text-muted text-sm mb-6 max-w-md">
        Khởi tạo các mẫu tiêu chuẩn để bắt đầu quản lý quy trình ký kết tự động.
      </p>
      <Button variant="primary" size="lg" leftIcon="Zap" onClick={onSeed}>
        Bắt đầu với mẫu tiêu chuẩn
      </Button>
    </div>
  );
}
