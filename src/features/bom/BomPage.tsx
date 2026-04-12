import { useState } from 'react';

import { Icon, AddButton, ClearFilterButton } from '@/shared/components';
import { Combobox } from '@/shared/components/Combobox';
import {
  useBomList,
  useApproveBom,
  useDeprecateBom,
  useReviseBom,
} from '@/application/production';

import { BOM_STATUSES, BOM_STATUS_LABELS } from './bom.module';
import { BomDetail } from './BomDetail';
import { BomForm } from './BomForm';
import { BomList } from './BomList';
import { BomTemplate, BomStatus, BomFilter } from './types';

export function BomPage() {
  const [filter, setFilter] = useState<BomFilter>({});
  const [viewState, setViewState] = useState<
    'list' | 'create' | 'edit' | 'detail'
  >('list');
  const [selectedBom, setSelectedBom] = useState<BomTemplate | null>(null);

  const { data: boms = [], isLoading } = useBomList(filter);
  const approveBom = useApproveBom();
  const deprecateBom = useDeprecateBom();
  const reviseBom = useReviseBom();

  const handleCreate = () => {
    setSelectedBom(null);
    setViewState('create');
  };

  const handleEdit = (bom: BomTemplate) => {
    setSelectedBom(bom);
    setViewState('edit');
  };

  const handleSelect = (bom: BomTemplate) => {
    setSelectedBom(bom);
    setViewState('detail');
  };

  const handleCancelForm = () => {
    setViewState('list');
    setSelectedBom(null);
  };

  const handleSuccessForm = () => {
    setViewState('list');
    setSelectedBom(null);
  };

  // --- Task-based actions ---
  const handleApprove = async () => {
    if (!selectedBom) return;
    const ok = window.confirm(
      `Bạn có chắc chắn muốn duyệt BOM ${selectedBom.code}?`,
    );
    if (!ok) return;
    try {
      await approveBom.mutateAsync({
        id: selectedBom.id,
        reason: 'Phê duyệt ban đầu',
      });
      setViewState('list');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    }
  };

  const handleDeprecate = async (bom?: BomTemplate) => {
    const target = bom ?? selectedBom;
    if (!target) return;
    const reason = window.prompt(
      `Lý do ngưng áp dụng (báo phế) BOM ${target.code}?`,
    );
    if (!reason) return;
    try {
      await deprecateBom.mutateAsync({
        id: target.id,
        reason,
      });
      setViewState('list');
      setSelectedBom(null);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    }
  };

  const handleRevise = async () => {
    if (!selectedBom) return;
    const reason = window.prompt(
      `Lý do tạo phiên bản mới từ BOM ${selectedBom.code}?`,
    );
    if (!reason) return;
    try {
      await reviseBom.mutateAsync({
        id: selectedBom.id,
        reason,
      });
      setViewState('list');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    }
  };

  // --- Form / Detail views ---
  if (viewState === 'create' || viewState === 'edit') {
    return (
      <BomForm
        initialData={selectedBom ?? undefined}
        onSuccess={handleSuccessForm}
        onCancel={handleCancelForm}
      />
    );
  }

  if (viewState === 'detail' && selectedBom) {
    return (
      <BomDetail
        bom={selectedBom}
        onBack={handleCancelForm}
        onApprove={handleApprove}
        onDeprecate={() => handleDeprecate()}
        onRevise={handleRevise}
        isSaving={
          approveBom.isPending || deprecateBom.isPending || reviseBom.isPending
        }
      />
    );
  }

  const hasFilter = !!(filter.search || filter.status);

  // --- List view (default) ---
  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">KỸ THUẬT</p>
          <h3 className="title-premium">Định Mức Nguyên Liệu (BOM)</h3>
        </div>
        <AddButton onClick={handleCreate} label="Tạo bản nháp" />
      </div>

      {/* KPI Dashboard */}
      <div className="kpi-grid p-4 md:p-6 bg-surface-subtle border-b border-border">
        <div className="kpi-card-premium kpi-primary">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Tổng số định mức</p>
              <p className="kpi-value">{boms.length}</p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Layers" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Tất cả thẻ định mức
          </div>
        </div>

        <div className="kpi-card-premium kpi-success">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Đang áp dụng</p>
              <p className="kpi-value">
                {boms.filter((b) => b.status === 'approved').length}
              </p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="CheckCircle" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            BOM đã duyệt
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar card-filter-section p-4 border-b border-border">
        <div className="filter-compact-premium">
          <div className="filter-field">
            <label htmlFor="bom-search">Tìm kiếm</label>
            <div className="search-input-wrapper">
              <input
                id="bom-search"
                className="field-input"
                type="text"
                placeholder="Mã hoặc tên BOM..."
                value={filter.search ?? ''}
                onChange={(e) =>
                  setFilter({
                    ...filter,
                    search: e.target.value || undefined,
                  })
                }
              />
              <Icon name="Search" size={16} className="search-input-icon" />
            </div>
          </div>

          <div className="filter-field">
            <label>Trạng thái</label>
            <Combobox
              options={[
                {
                  value: '',
                  label: 'Tất cả trạng thái',
                },
                ...BOM_STATUSES.map((s) => ({
                  value: s,
                  label: BOM_STATUS_LABELS[s],
                })),
              ]}
              value={filter.status ?? ''}
              onChange={(val) =>
                setFilter({
                  ...filter,
                  status: (val as BomStatus) || undefined,
                })
              }
            />
          </div>

          {hasFilter && <ClearFilterButton onClick={() => setFilter({})} />}
        </div>
      </div>

      {/* Table */}
      <BomList
        boms={boms}
        isLoading={isLoading}
        hasFilter={hasFilter}
        onSelect={handleSelect}
        onEdit={handleEdit}
        onDeprecate={(bom) => handleDeprecate(bom)}
        onCreate={handleCreate}
      />
    </div>
  );
}
