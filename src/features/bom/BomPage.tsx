import { useState } from 'react';
import toast from 'react-hot-toast';

import {
  Icon,
  AddButton,
  FilterBarPremium,
  type FilterFieldConfig,
} from '@/shared/components';
import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import {
  useBomList,
  useBomDetail,
  useApproveBom,
  useDeprecateBom,
  useReviseBom,
} from '@/application/production';

import { BOM_STATUSES, BOM_STATUS_LABELS } from './bom.module';
import { BomDetail } from './BomDetail';
import { BomForm } from './BomForm';
import { BomList } from './BomList';
import type { BomFilter } from './types';

type ViewState = 'list' | 'create' | 'edit' | 'detail';

type ActionSheetState =
  | { type: 'idle' }
  | { type: 'approve'; bomId: string; bomCode: string }
  | { type: 'deprecate'; bomId: string; bomCode: string }
  | { type: 'revise'; bomId: string; bomCode: string };

export function BomPage() {
  const [filter, setFilter] = useState<BomFilter>({});
  const [viewState, setViewState] = useState<ViewState>('list');
  const [selectedBomId, setSelectedBomId] = useState<string | null>(null);
  const [actionSheet, setActionSheet] = useState<ActionSheetState>({
    type: 'idle',
  });
  const [actionReason, setActionReason] = useState('');

  const { data: boms = [], isLoading } = useBomList(filter);
  const { data: selectedBom } = useBomDetail(
    viewState === 'detail' ? selectedBomId : null,
  );
  const approveBom = useApproveBom();
  const deprecateBom = useDeprecateBom();
  const reviseBom = useReviseBom();

  const filterSchema: FilterFieldConfig[] = [
    {
      key: 'search',
      type: 'search',
      label: 'Tìm kiếm',
      placeholder: 'Mã hoặc tên BOM...',
    },
    {
      key: 'status',
      type: 'combobox',
      label: 'Trạng thái',
      options: BOM_STATUSES.map((s) => ({
        value: s,
        label: BOM_STATUS_LABELS[s],
      })),
    },
  ];

  function handleFilterChange(key: string, value: string | undefined) {
    setFilter((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  }

  const handleCreate = () => {
    setSelectedBomId(null);
    setViewState('create');
  };

  const handleEdit = (bomId: string) => {
    setSelectedBomId(bomId);
    setViewState('edit');
  };

  const handleSelect = (bomId: string) => {
    setSelectedBomId(bomId);
    setViewState('detail');
  };

  const handleCancelForm = () => {
    setViewState('list');
    setSelectedBomId(null);
  };

  const handleSuccessForm = () => {
    setViewState('list');
    setSelectedBomId(null);
  };

  const closeActionSheet = () => {
    setActionSheet({ type: 'idle' });
    setActionReason('');
  };

  // --- Mở BottomSheet xác nhận ---
  const openApproveSheet = (bomId: string, bomCode: string) => {
    setActionSheet({
      type: 'approve',
      bomId,
      bomCode,
    });
  };

  const openDeprecateSheet = (bomId: string, bomCode: string) => {
    setActionSheet({
      type: 'deprecate',
      bomId,
      bomCode,
    });
  };

  const openReviseSheet = (bomId: string, bomCode: string) => {
    setActionSheet({
      type: 'revise',
      bomId,
      bomCode,
    });
  };

  // --- Thực thi hành động ---
  const handleConfirmAction = async () => {
    if (actionSheet.type === 'idle') return;

    try {
      if (actionSheet.type === 'approve') {
        await approveBom.mutateAsync({
          id: actionSheet.bomId,
          reason: actionReason || 'Phe duyet',
        });
        toast.success(`Da phe duyet BOM ${actionSheet.bomCode}`);
      }

      if (actionSheet.type === 'deprecate') {
        if (!actionReason.trim()) {
          toast.error('Vui long nhap ly do bao phe.');
          return;
        }
        await deprecateBom.mutateAsync({
          id: actionSheet.bomId,
          reason: actionReason,
        });
        toast.success(`Da bao phe BOM ${actionSheet.bomCode}`);
      }

      if (actionSheet.type === 'revise') {
        if (!actionReason.trim()) {
          toast.error('Vui long nhap ly do tao phien ban moi.');
          return;
        }
        await reviseBom.mutateAsync({
          id: actionSheet.bomId,
          reason: actionReason,
        });
        toast.success(`Da tao phien ban moi cho BOM ${actionSheet.bomCode}`);
      }

      closeActionSheet();
      setViewState('list');
      setSelectedBomId(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    }
  };

  const isMutating =
    approveBom.isPending || deprecateBom.isPending || reviseBom.isPending;

  // --- Form views ---
  if (viewState === 'create' || viewState === 'edit') {
    // Tìm BOM từ danh sách đã fetch cho form edit
    const editBom =
      viewState === 'edit'
        ? (boms.find((b) => b.id === selectedBomId) ?? undefined)
        : undefined;
    return (
      <BomForm
        initialData={editBom}
        onSuccess={handleSuccessForm}
        onCancel={handleCancelForm}
      />
    );
  }

  // --- Detail view ---
  if (viewState === 'detail' && selectedBomId) {
    return (
      <>
        <BomDetail
          bomId={selectedBomId}
          bom={selectedBom ?? null}
          onBack={handleCancelForm}
          onApprove={(id, code) => openApproveSheet(id, code)}
          onDeprecate={(id, code) => openDeprecateSheet(id, code)}
          onRevise={(id, code) => openReviseSheet(id, code)}
          isSaving={isMutating}
        />
        {renderActionSheet()}
      </>
    );
  }

  const hasFilter = !!(filter.search || filter.status);

  // --- List view (default) ---
  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">KY THUAT</p>
          <h3 className="title-premium">Dinh Muc Nguyen Lieu (BOM)</h3>
        </div>
        <AddButton onClick={handleCreate} label="Tao ban nhap" />
      </div>

      {/* KPI Dashboard */}
      <div className="kpi-grid p-4 md:p-6 bg-surface-subtle border-b border-border">
        <div className="kpi-card-premium kpi-primary">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Tong so dinh muc</p>
              <p className="kpi-value">{boms.length}</p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Layers" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Tat ca the dinh muc
          </div>
        </div>

        <div className="kpi-card-premium kpi-success">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Dang ap dung</p>
              <p className="kpi-value">
                {boms.filter((b) => b.status === 'approved').length}
              </p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="CheckCircle" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            BOM da duyet
          </div>
        </div>
      </div>

      {/* Filters */}
      <FilterBarPremium
        schema={filterSchema}
        value={filter}
        onChange={handleFilterChange}
        onClear={() => setFilter({})}
      />

      {/* Table */}
      <BomList
        boms={boms}
        isLoading={isLoading}
        hasFilter={hasFilter}
        onSelect={(bom) => handleSelect(bom.id)}
        onEdit={(bom) => handleEdit(bom.id)}
        onDeprecate={(bom) => openDeprecateSheet(bom.id, bom.code)}
        onCreate={handleCreate}
      />

      {/* Action Sheet */}
      {renderActionSheet()}
    </div>
  );

  function renderActionSheet() {
    if (actionSheet.type === 'idle') return null;

    const titles: Record<string, string> = {
      approve: `Phe duyet BOM ${actionSheet.bomCode}`,
      deprecate: `Bao phe BOM ${actionSheet.bomCode}`,
      revise: `Tao phien ban moi — ${actionSheet.bomCode}`,
    };

    const needsReason = actionSheet.type !== 'approve';
    const reasonLabels: Record<string, string> = {
      deprecate: 'Ly do ngung ap dung',
      revise: 'Ly do tao phien ban moi',
    };

    return (
      <AdaptiveSheet
        open
        onClose={closeActionSheet}
        title={titles[actionSheet.type] ?? ''}
        footer={
          <div className="flex gap-3 w-full">
            <Button
              variant="secondary"
              className="flex-1"
              type="button"
              onClick={closeActionSheet}
              disabled={isMutating}
            >
              Huy
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              type="button"
              onClick={handleConfirmAction}
              disabled={isMutating}
            >
              {isMutating ? 'Dang xu ly...' : 'Xac nhan'}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {actionSheet.type === 'approve' && (
            <p className="text-sm text-muted">
              Ban co chac chan muon phe duyet BOM nay? Sau khi duyet, BOM se
              duoc ap dung cho san xuat.
            </p>
          )}

          {needsReason && (
            <div className="form-field">
              <label>{reasonLabels[actionSheet.type]}</label>
              <textarea
                className="field-input min-h-[80px]"
                placeholder="Nhap ly do..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                autoFocus
              />
            </div>
          )}

          {actionSheet.type === 'approve' && (
            <div className="form-field">
              <label>Ghi chu (tuy chon)</label>
              <textarea
                className="field-input min-h-[60px]"
                placeholder="Ghi chu phe duyet..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
              />
            </div>
          )}
        </div>
      </AdaptiveSheet>
    );
  }
}
