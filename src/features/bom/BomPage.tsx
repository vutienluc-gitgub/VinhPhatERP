import { useState } from 'react';

import { BOM_STATUSES, BOM_STATUS_LABELS } from './bom.module';
import { BomDetail } from './BomDetail';
import { BomForm } from './BomForm';
import { BomList } from './BomList';
import { BomTemplate, BomStatus, BomFilter } from './types';
import {
  useBomList,
  useApproveBom,
  useDeprecateBom,
  useReviseBom,
} from './useBom';

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

  // --- List view (default) ---
  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Kỹ thuật</p>
            <h3>Định mức (BOM)</h3>
          </div>
          <button
            className="primary-button btn-standard"
            type="button"
            onClick={handleCreate}
          >
            + Tạo bản nháp
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar card-filter-section">
        <div className="filter-field" style={{ flex: '1 1 220px' }}>
          <label htmlFor="bom-search">Tìm kiếm</label>
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
        </div>

        <div className="filter-field">
          <label htmlFor="bom-status">Trạng thái</label>
          <select
            id="bom-status"
            className="field-select"
            value={filter.status ?? ''}
            onChange={(e) =>
              setFilter({
                ...filter,
                status: (e.target.value as BomStatus) || undefined,
              })
            }
          >
            <option value="">Tất cả</option>
            {BOM_STATUSES.map((s) => (
              <option key={s} value={s}>
                {BOM_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        {(filter.search || filter.status) && (
          <button
            className="btn-secondary"
            type="button"
            onClick={() => setFilter({})}
            style={{ alignSelf: 'flex-end' }}
          >
            ✕ Xóa lọc
          </button>
        )}
      </div>

      {/* Table */}
      <div
        className="data-table-wrap card-table-section"
        style={isLoading || boms.length === 0 ? { border: 'none' } : undefined}
      >
        {isLoading ? (
          <div className="table-empty">Đang tải danh sách BOM...</div>
        ) : boms.length === 0 ? (
          <div className="table-empty">
            <p>Chưa có công thức định mức (BOM) nào.</p>
            <p
              style={{
                fontSize: '0.82rem',
                marginTop: '0.5rem',
              }}
            >
              Nhấn nút tạo để bắt đầu.
            </p>
          </div>
        ) : (
          <BomList
            boms={boms}
            onSelect={handleSelect}
            onEdit={handleEdit}
            onDeprecate={(bom) => handleDeprecate(bom)}
          />
        )}
      </div>
    </div>
  );
}
