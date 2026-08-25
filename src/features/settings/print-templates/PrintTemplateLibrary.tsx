import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';

import {
  useSaveTemplateRevision,
  type PrintTemplateEntity,
} from '@/domain/print';
import {
  ActionMenu,
  Button,
  EmptyState,
  Icon,
  TabSwitcher,
  VPSelect,
  ViewToggle,
} from '@/shared/components';

import {
  useArchivePrintTemplate,
  useCreatePrintTemplate,
  useDuplicatePrintTemplate,
  usePrintTemplateDefaults,
  usePrintTemplates,
  useSetDefaultPrintTemplate,
  useUpdatePrintTemplate,
} from './usePrintTemplates';
import { PrintTemplateCard } from './PrintTemplateCard';
import { PrintTemplateTable } from './PrintTemplateTable';
import { QuickPrintPreviewModal } from './QuickPrintPreviewModal';
import { CreateTemplateModal, DuplicateTemplateModal } from './TemplateModals';
import { PrintJobHistoryModal } from './PrintJobHistoryModal';
import { TemplateImportExportModal } from './TemplateImportExportModal';
import { TemplateVersionHistoryModal } from './TemplateVersionHistoryModal';
import { PrintDesignerStudio } from './designer';
import {
  PRINT_DOC_TABS,
  PRINT_TEMPLATE_LABELS,
  PRINT_TEMPLATE_MESSAGES,
} from './print-templates.constants';

export function PrintTemplateLibrary() {
  const { data: templates = [], isLoading } = usePrintTemplates();
  const { data: defaultsMap = {} } = usePrintTemplateDefaults();

  const createMutation = useCreatePrintTemplate();
  const updateMutation = useUpdatePrintTemplate();
  const duplicateMutation = useDuplicatePrintTemplate();
  const setDefaultMutation = useSetDefaultPrintTemplate();
  const archiveMutation = useArchivePrintTemplate();
  const saveRevisionMutation = useSaveTemplateRevision();

  const [searchQuery, setSearchQuery] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('ALL');
  const [printerFilter, setPrinterFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'active' | 'draft' | 'archived'
  >('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal & Studio States
  const [editingTemplate, setEditingTemplate] =
    useState<PrintTemplateEntity | null>(null);
  const [previewTemplate, setPreviewTemplate] =
    useState<PrintTemplateEntity | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [versionHistoryTarget, setVersionHistoryTarget] =
    useState<PrintTemplateEntity | null>(null);
  const [duplicateTarget, setDuplicateTarget] =
    useState<PrintTemplateEntity | null>(null);

  // Dynamic Tabs with live counters
  const docTabs = useMemo(() => {
    return PRINT_DOC_TABS.map((tab) => ({
      key: tab.key,
      label: tab.label,
      badge:
        tab.key === 'ALL'
          ? templates.length
          : templates.filter((t) => t.documentType === tab.key).length,
    }));
  }, [templates]);

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = tpl.name.toLowerCase().includes(q);
        const matchCode = tpl.code.toLowerCase().includes(q);
        if (!matchName && !matchCode) return false;
      }

      // Doc Type
      if (docTypeFilter !== 'ALL' && tpl.documentType !== docTypeFilter) {
        return false;
      }

      // Printer Type
      if (
        printerFilter !== 'ALL' &&
        tpl.targetPrinterProfile !== printerFilter
      ) {
        return false;
      }

      // Status
      if (statusFilter !== 'ALL' && tpl.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [templates, searchQuery, docTypeFilter, printerFilter, statusFilter]);

  const handleSetDefault = async (tpl: PrintTemplateEntity) => {
    try {
      await setDefaultMutation.mutateAsync({
        templateId: tpl.id,
        documentType: tpl.documentType,
        printerProfileType: tpl.targetPrinterProfile,
        paperFormat: tpl.paperFormat,
      });
      toast.success(PRINT_TEMPLATE_MESSAGES.SET_DEFAULT_SUCCESS);
    } catch {
      toast.error('Lỗi khi thiết lập mẫu mặc định');
    }
  };

  const handleToggleArchive = async (tpl: PrintTemplateEntity) => {
    try {
      await archiveMutation.mutateAsync(tpl.id);
      toast.success(
        tpl.status === 'archived'
          ? PRINT_TEMPLATE_MESSAGES.RESTORE_SUCCESS
          : PRINT_TEMPLATE_MESSAGES.ARCHIVE_SUCCESS,
      );
    } catch {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleCreateSubmit = async (
    data: Omit<
      PrintTemplateEntity,
      'id' | 'createdAt' | 'updatedAt' | 'revision'
    >,
  ) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success(PRINT_TEMPLATE_MESSAGES.CREATE_SUCCESS);
    } catch {
      toast.error('Lỗi khi tạo mẫu in');
    }
  };

  const handleDuplicateSubmit = async (params: {
    templateId: string;
    newName: string;
    newCode: string;
  }) => {
    try {
      await duplicateMutation.mutateAsync(params);
      toast.success(PRINT_TEMPLATE_MESSAGES.DUPLICATE_SUCCESS);
    } catch {
      toast.error('Lỗi khi nhân bản mẫu in');
    }
  };

  const handleDesignerSave = async (updated: PrintTemplateEntity) => {
    await updateMutation.mutateAsync(updated);
    await saveRevisionMutation.mutateAsync({
      template: updated,
      note: `Bản sửa đổi rev.${updated.revision} từ Visual Designer`,
    });
    setEditingTemplate(updated);
  };

  if (editingTemplate) {
    return (
      <PrintDesignerStudio
        initialTemplate={editingTemplate}
        onBack={() => setEditingTemplate(null)}
        onSave={handleDesignerSave}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="panel-card card-flush p-6 flex flex-col gap-4 animate-pulse">
        <div className="h-6 w-48 bg-surface-secondary rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-44 bg-surface-secondary rounded-2xl" />
          <div className="h-44 bg-surface-secondary rounded-2xl" />
          <div className="h-44 bg-surface-secondary rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="panel-card card-flush flex flex-col gap-6">
      {/* Workspace Header Area */}
      <div className="card-header-area flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon name="Printer" size={20} strokeWidth={1.5} />
          </div>
          <div>
            <span className="font-bold text-lg text-foreground block">
              {PRINT_TEMPLATE_LABELS.TITLE}
            </span>
            <span className="text-xs text-foreground/75 font-medium">
              {PRINT_TEMPLATE_LABELS.SUBTITLE}
            </span>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Utilities Dropdown Menu */}
          <ActionMenu
            items={[
              {
                icon: 'ArrowDownUp',
                onClick: () => setIsImportExportOpen(true),
                label: 'Xuất / Nhập File Mẫu (JSON)',
              },
              {
                icon: 'History',
                onClick: () => setIsHistoryOpen(true),
                label: 'Nhật Ký Lịch Sử In Ấn',
              },
            ]}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="font-semibold gap-1.5 h-9"
              title="Công cụ tiện ích xuất nhập file và nhật ký"
            >
              <Icon name="Wrench" size={15} />
              {PRINT_TEMPLATE_LABELS.BTN_UTILITIES}
              <Icon name="ChevronDown" size={13} className="text-muted" />
            </Button>
          </ActionMenu>

          {/* Primary Create Button */}
          <Button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            size="sm"
            className="font-bold gap-1.5 shadow-sm h-9 px-4"
          >
            <Icon name="Plus" size={16} />
            {PRINT_TEMPLATE_LABELS.BTN_CREATE}
          </Button>
        </div>
      </div>

      <div className="p-6 pt-0 flex flex-col gap-5">
        {/* Standard TabSwitcher */}
        <div className="w-full">
          <TabSwitcher
            tabs={docTabs}
            active={docTypeFilter}
            onChange={(key) => setDocTypeFilter(key)}
            size="sm"
          />
        </div>

        {/* Filters & Search Toolbar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-surface-secondary/40 p-3 rounded-2xl border border-default">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Icon
              name="Search"
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={PRINT_TEMPLATE_LABELS.SEARCH_PLACEHOLDER}
              className="field-input pl-9 text-xs h-9"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              >
                <Icon name="X" size={14} />
              </button>
            )}
          </div>

          {/* Filters Group */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Printer filter */}
            <div className="w-[160px] shrink-0">
              <VPSelect
                size="sm"
                value={printerFilter}
                onValueChange={(val) => setPrinterFilter(val)}
                options={[
                  { value: 'ALL', label: PRINT_TEMPLATE_LABELS.ALL_PRINTERS },
                  { value: 'dot_matrix', label: 'In Kim (3 liên)' },
                  { value: 'laser', label: 'Laser / PDF' },
                  { value: 'thermal_receipt', label: 'In Nhiệt K80' },
                  { value: 'thermal_label', label: 'Tem Barcode' },
                ]}
              />
            </div>

            {/* Status filter */}
            <div className="w-[150px] shrink-0">
              <VPSelect<'ALL' | 'active' | 'draft' | 'archived'>
                size="sm"
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val)}
                options={[
                  { value: 'ALL', label: PRINT_TEMPLATE_LABELS.STATUS_ALL },
                  {
                    value: 'active',
                    label: PRINT_TEMPLATE_LABELS.STATUS_ACTIVE,
                  },
                  { value: 'draft', label: PRINT_TEMPLATE_LABELS.STATUS_DRAFT },
                  {
                    value: 'archived',
                    label: PRINT_TEMPLATE_LABELS.STATUS_ARCHIVED,
                  },
                ]}
              />
            </div>

            {/* View Mode Toggle */}
            <div className="shrink-0 ml-auto">
              <ViewToggle
                value={viewMode}
                onChange={(mode) => setViewMode(mode as 'grid' | 'table')}
                modes={['grid', 'table']}
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* Content View */}
        {filteredTemplates.length === 0 ? (
          <EmptyState
            icon="Printer"
            title={PRINT_TEMPLATE_LABELS.EMPTY_TITLE}
            description={PRINT_TEMPLATE_LABELS.EMPTY_DESC}
            actionLabel={PRINT_TEMPLATE_LABELS.BTN_CREATE}
            actionIcon="Plus"
            actionClick={() => setIsCreateOpen(true)}
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredTemplates.map((tpl) => {
              const contextKey = `${tpl.documentType}:${tpl.targetPrinterProfile}:${tpl.paperFormat}`;
              const isDefault = defaultsMap[contextKey] === tpl.id;

              return (
                <PrintTemplateCard
                  key={tpl.id}
                  template={tpl}
                  isDefault={isDefault}
                  onPreview={(target) => setPreviewTemplate(target)}
                  onOpenDesigner={(target) => setEditingTemplate(target)}
                  onDuplicate={(target) => setDuplicateTarget(target)}
                  onSetDefault={handleSetDefault}
                  onToggleArchive={handleToggleArchive}
                />
              );
            })}
          </div>
        ) : (
          <PrintTemplateTable
            templates={filteredTemplates}
            defaultsMap={defaultsMap}
            onPreview={(target) => setPreviewTemplate(target)}
            onOpenDesigner={(target) => setEditingTemplate(target)}
            onDuplicate={(target) => setDuplicateTarget(target)}
            onSetDefault={handleSetDefault}
            onToggleArchive={handleToggleArchive}
          />
        )}
      </div>

      {/* Modals */}
      <QuickPrintPreviewModal
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />

      <CreateTemplateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <DuplicateTemplateModal
        template={duplicateTarget}
        onClose={() => setDuplicateTarget(null)}
        onSubmit={handleDuplicateSubmit}
      />

      <PrintJobHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      <TemplateImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        templates={templates}
        onImportSuccess={handleCreateSubmit}
      />

      <TemplateVersionHistoryModal
        isOpen={Boolean(versionHistoryTarget)}
        template={versionHistoryTarget}
        onClose={() => setVersionHistoryTarget(null)}
        onRollback={async (snapshot) => {
          await updateMutation.mutateAsync(snapshot);
          toast.success(`Đã khôi phục về phiên bản rev.${snapshot.revision}`);
        }}
      />
    </div>
  );
}
