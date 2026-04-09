import { useState } from 'react';
import { useMemo } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import { Pagination } from '@/shared/components/Pagination';
import { fetchRawFabricAll } from '@/api/raw-fabric.api';
import { Icon } from '@/shared/components/Icon';
import { LotMatrixCard } from '@/shared/components/roll-grid';

import {
  QUALITY_GRADE_LABELS,
  QUALITY_GRADES,
  ROLL_STATUS_LABELS,
  ROLL_STATUSES,
} from './raw-fabric.module';
import type {
  RawFabricFilter,
  RawFabricRoll,
  RollStatus,
  QualityGrade,
} from './types';
import {
  useDeleteRawFabric,
  useRawFabricList,
  useRawFabricStats,
} from './useRawFabric';
import { useRawFabricExport } from './useRawFabricExport';

type SortCol = 'created_at' | 'weight_kg' | 'roll_number';

type RawFabricListProps = {
  onEdit: (roll: RawFabricRoll) => void;
  onNew: () => void;
  onBulkNew: () => void;
};

function formatNum(val: number | null, unit: string): string {
  if (val === null || val === undefined) return '—';
  return `${val.toLocaleString('vi-VN')} ${unit}`;
}

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active)
    return (
      <span
        style={{
          opacity: 0.3,
          marginLeft: 4,
        }}
      >
        ↕
      </span>
    );
  return <span style={{ marginLeft: 4 }}>{dir === 'asc' ? '↑' : '↓'}</span>;
}

export function RawFabricList({
  onEdit,
  onNew,
  onBulkNew,
}: RawFabricListProps) {
  const [filters, setFilters] = useState<RawFabricFilter>({});
  const [fabricTypeInput, setFabricTypeInput] = useState('');
  const [rollNumberInput, setRollNumberInput] = useState('');
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState<SortCol>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');

  const activeFilters: RawFabricFilter = {
    ...filters,
    sort_by: sortCol,
    sort_dir: sortDir,
  };

  const {
    data: result,
    isLoading,
    error,
  } = useRawFabricList(activeFilters, page);
  const rolls = result?.data ?? [];
  const { data: stats } = useRawFabricStats();
  const deleteMutation = useDeleteRawFabric();
  const { confirm } = useConfirm();
  const { exportExcel, exportPdf } = useRawFabricExport();

  function handleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
    setPage(1);
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      status: (e.target.value as RollStatus) || undefined,
    }));
  }

  function handleGradeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      quality_grade: (e.target.value as QualityGrade) || undefined,
    }));
  }

  function handleFabricTypeSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      fabric_type: fabricTypeInput.trim() || undefined,
    }));
  }

  function handleRollNumberSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      roll_number: rollNumberInput.trim() || undefined,
    }));
  }

  async function handleExportExcel() {
    setIsExporting(true);
    try {
      const all = await fetchRawFabricAll(filters);
      exportExcel(all);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleExportPdf() {
    setIsExporting(true);
    try {
      const all = await fetchRawFabricAll(filters);
      exportPdf(all);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDelete(roll: RawFabricRoll) {
    const ok = await confirm({
      message: `Xóa cuộn "${roll.roll_number}"? Hành động này không thể hoàn tác.`,
      variant: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(roll.id);
  }

  const hasFilter = !!(
    filters.status ??
    filters.quality_grade ??
    filters.fabric_type ??
    filters.roll_number
  );

  // Grouping logic for Grid View
  const groupedRolls = useMemo(() => {
    const map = new Map<string, RawFabricRoll[]>();
    rolls.forEach((roll) => {
      const key = roll.lot_number || 'KHÔNG CÓ LÔ';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(roll);
    });
    return Array.from(map.entries()).map(([lot, items]) => ({
      lot,
      rolls: items,
      fabricType: items[0]?.fabric_type,
      colorName: items[0]?.color_name,
    }));
  }, [rolls]);

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Kho vải mộc</p>
            <h3>Danh sách cuộn vải mộc</h3>
          </div>
          <div style={{ flex: 1 }} />

          <div
            className="view-toggle-group"
            style={{
              display: 'flex',
              gap: '0.25rem',
              background: 'var(--surface-subtle)',
              padding: '0.25rem',
              borderRadius: '8px',
              marginRight: '0.5rem',
            }}
          >
            <button
              className={`btn-icon ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Dạng bảng"
              style={{
                background:
                  viewMode === 'table' ? 'var(--surface)' : 'transparent',
                boxShadow:
                  viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <Icon name="LayoutList" size={18} />
            </button>
            <button
              className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Dạng lưới"
              style={{
                background:
                  viewMode === 'grid' ? 'var(--surface)' : 'transparent',
                boxShadow:
                  viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <Icon name="LayoutGrid" size={18} />
            </button>
          </div>

          <button
            className="primary-button btn-standard"
            type="button"
            onClick={onNew}
          >
            + Nhập cuộn mới
          </button>
          <button
            className="btn-secondary btn-standard"
            type="button"
            onClick={onBulkNew}
          >
            ⚡ Nhập hàng loạt
          </button>
          <button
            className="btn-secondary btn-standard"
            type="button"
            onClick={() => void handleExportExcel()}
            disabled={isExporting}
            title="Xuất toàn bộ kết quả lọc ra Excel"
          >
            {isExporting ? '...' : '📊 Excel'}
          </button>
          <button
            className="btn-secondary btn-standard"
            type="button"
            onClick={() => void handleExportPdf()}
            disabled={isExporting}
            title="Xuất toàn bộ kết quả lọc ra PDF"
          >
            {isExporting ? '...' : '🖨 PDF'}
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-bar">
          <div className="stat-card stat-primary">
            <span className="stat-label">Tổng cuộn</span>
            <span className="stat-value">
              {stats.totalRolls.toLocaleString('vi-VN')}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Tổng chiều dài</span>
            <span className="stat-value">
              {stats.totalLengthM.toLocaleString('vi-VN', {
                maximumFractionDigits: 1,
              })}
              <span className="stat-unit">m</span>
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Tổng trọng lượng</span>
            <span className="stat-value">
              {stats.totalWeightKg.toLocaleString('vi-VN', {
                maximumFractionDigits: 1,
              })}
              <span className="stat-unit">kg</span>
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar card-filter-section">
        <form
          className="filter-field"
          onSubmit={handleFabricTypeSearch}
          style={{ flex: '1 1 180px' }}
        >
          <label htmlFor="filter-fabric-type">Loại vải</label>
          <div className="flex-controls">
            <input
              id="filter-fabric-type"
              className="field-input"
              type="text"
              placeholder="Tìm loại vải..."
              value={fabricTypeInput}
              onChange={(e) => setFabricTypeInput(e.target.value)}
            />
            <button
              className="btn-secondary"
              type="submit"
              style={{ whiteSpace: 'nowrap' }}
            >
              Lọc
            </button>
          </div>
        </form>

        <form
          className="filter-field"
          onSubmit={handleRollNumberSearch}
          style={{ flex: '1 1 160px' }}
        >
          <label htmlFor="filter-roll-number">Mã cuộn</label>
          <div className="flex-controls">
            <input
              id="filter-roll-number"
              className="field-input"
              type="text"
              placeholder="VD: BGR-001..."
              value={rollNumberInput}
              onChange={(e) => setRollNumberInput(e.target.value)}
            />
            <button
              className="btn-secondary"
              type="submit"
              style={{ whiteSpace: 'nowrap' }}
            >
              Tìm
            </button>
          </div>
        </form>

        <div className="filter-field">
          <label htmlFor="filter-status">Trạng thái</label>
          <select
            id="filter-status"
            className="field-select"
            value={filters.status ?? ''}
            onChange={handleStatusChange}
          >
            <option value="">Tất cả</option>
            {ROLL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ROLL_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="filter-grade">Chất lượng</label>
          <select
            id="filter-grade"
            className="field-select"
            value={filters.quality_grade ?? ''}
            onChange={handleGradeChange}
          >
            <option value="">Tất cả</option>
            {QUALITY_GRADES.map((g) => (
              <option key={g} value={g}>
                {QUALITY_GRADE_LABELS[g]}
              </option>
            ))}
          </select>
        </div>

        {hasFilter && (
          <button
            className="btn-secondary"
            type="button"
            onClick={() => {
              setFilters({});
              setFabricTypeInput('');
              setRollNumberInput('');
            }}
            style={{ alignSelf: 'flex-end' }}
          >
            ✕ Xóa lọc
          </button>
        )}
      </div>

      {error && (
        <p className="error-inline">
          Lỗi tải dữ liệu: {(error as Error).message}
        </p>
      )}

      {/* Data Section */}
      <div className="card-table-section">
        {isLoading ? (
          <p className="table-empty">Đang tải...</p>
        ) : rolls.length === 0 ? (
          <p className="table-empty">
            {hasFilter
              ? 'Không tìm thấy cuộn vải phù hợp.'
              : 'Chưa có cuộn vải nào. Nhấn "+ Nhập cuộn mới" để bắt đầu.'}
          </p>
        ) : viewMode === 'grid' ? (
          <div
            className="grid-view-container"
            style={{
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}
          >
            {groupedRolls.map((group) => (
              <LotMatrixCard
                key={group.lot}
                title={group.lot}
                lotNumber={group.lot !== 'KHÔNG CÓ LÔ' ? group.lot : undefined}
                colorName={group.colorName || undefined}
                expectedRollsCount={group.rolls.length}
                rolls={group.rolls.map((r) => ({
                  id: r.id,
                  roll_number: r.roll_number,
                  weight_kg: r.weight_kg ?? undefined,
                  status: r.status,
                }))}
                mode="view"
                onRollPress={(roll) => {
                  const original = rolls.find((r) => r.id === roll.id);
                  if (original) onEdit(original);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th
                    style={{
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => handleSort('roll_number')}
                  >
                    Mã cuộn{' '}
                    <SortIcon
                      active={sortCol === 'roll_number'}
                      dir={sortDir}
                    />
                  </th>
                  <th>Số lô</th>
                  <th>Loại vải</th>
                  <th>CL</th>
                  <th>Khổ × Dài</th>
                  <th
                    style={{
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => handleSort('weight_kg')}
                  >
                    Trọng lượng{' '}
                    <SortIcon active={sortCol === 'weight_kg'} dir={sortDir} />
                  </th>
                  <th>Trạng thái</th>
                  <th>Vị trí kho</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rolls.map((roll) => (
                  <tr key={roll.id}>
                    <td>
                      <strong>{roll.roll_number}</strong>
                      {roll.color_name && (
                        <div className="td-muted">{roll.color_name}</div>
                      )}
                    </td>
                    <td className="td-muted">{roll.lot_number ?? '—'}</td>
                    <td>{roll.fabric_type}</td>
                    <td>
                      {roll.quality_grade ? (
                        <span
                          className={`grade-badge grade-${roll.quality_grade}`}
                        >
                          {roll.quality_grade}
                        </span>
                      ) : (
                        <span className="td-muted">—</span>
                      )}
                    </td>
                    <td className="td-muted">
                      {roll.width_cm !== null ? `${roll.width_cm} cm` : '—'}
                      {roll.length_m !== null &&
                        ` × ${formatNum(roll.length_m, 'm')}`}
                    </td>
                    <td className="td-muted">
                      {formatNum(roll.weight_kg, 'kg')}
                    </td>
                    <td>
                      <span className={`roll-status ${roll.status}`}>
                        {ROLL_STATUS_LABELS[roll.status]}
                      </span>
                    </td>
                    <td className="td-muted">
                      {roll.warehouse_location ?? '—'}
                    </td>
                    <td className="td-actions">
                      <button
                        className="btn-icon"
                        type="button"
                        title="Sửa"
                        onClick={() => onEdit(roll)}
                        style={{ marginRight: 4 }}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon danger"
                        type="button"
                        title="Xóa"
                        onClick={() => void handleDelete(roll)}
                        disabled={deleteMutation.isPending}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination result={result} onPageChange={setPage} />
    </div>
  );
}
