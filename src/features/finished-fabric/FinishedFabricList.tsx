import { useState } from 'react';
import { useMemo } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import { Pagination } from '@/shared/components/Pagination';
import { Icon } from '@/shared/components/Icon';
import { LotMatrixCard } from '@/shared/components/roll-grid';

import {
  QUALITY_GRADE_LABELS,
  QUALITY_GRADES,
  ROLL_STATUS_LABELS,
  ROLL_STATUSES,
} from './finished-fabric.module';
import {
  canDeleteRoll,
  canEditRoll,
  deleteBlockReason,
  editBlockReason,
} from './transitions';
import type {
  FinishedFabricFilter,
  FinishedFabricRoll,
  QualityGrade,
  RollStatus,
} from './types';
import {
  useDeleteFinishedFabric,
  useFinishedFabricList,
  useFinishedFabricStats,
} from './useFinishedFabric';
import { useFinishedFabricExport } from './useFinishedFabricExport';

type FinishedFabricListProps = {
  onEdit: (roll: FinishedFabricRoll) => void;
  onNew: () => void;
  onBulkNew: () => void;
  onTrace: (roll: FinishedFabricRoll) => void;
};

function formatNum(val: number | null, unit: string): string {
  if (val === null || val === undefined) return '—';
  return `${val.toLocaleString('vi-VN')} ${unit}`;
}

export function FinishedFabricList({
  onEdit,
  onNew,
  onBulkNew,
  onTrace,
}: FinishedFabricListProps) {
  const [filters, setFilters] = useState<FinishedFabricFilter>({});
  const [fabricTypeInput, setFabricTypeInput] = useState('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');

  const {
    data: result,
    isLoading,
    error,
  } = useFinishedFabricList(filters, page);
  const rolls = result?.data ?? [];
  const { data: stats } = useFinishedFabricStats();
  const deleteMutation = useDeleteFinishedFabric();
  const { confirm } = useConfirm();
  const { exportExcel, exportPdf } = useFinishedFabricExport();

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value as RollStatus | '';
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      status: val || undefined,
    }));
  }

  function handleGradeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value as QualityGrade | '';
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      quality_grade: val || undefined,
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

  async function handleDelete(roll: FinishedFabricRoll) {
    if (!canDeleteRoll(roll.status)) return;
    const ok = await confirm({
      message: `Xóa cuộn "${roll.roll_number}"? Hành động này không thể hoàn tác.`,
      variant: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(roll.id);
  }

  // Median helper
  const median = (values: number[]) => {
    if (values.length === 0) return undefined;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1]! + sorted[mid]!) / 2;
  };

  // Grouping logic
  const groupedRolls = useMemo(() => {
    const map = new Map<string, FinishedFabricRoll[]>();
    rolls.forEach((roll) => {
      const key = roll.lot_number || 'KHÔNG CÓ LÔ';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(roll);
    });
    return Array.from(map.entries()).map(([lot, items]) => {
      const weights = items
        .map((r) => r.weight_kg)
        .filter((w): w is number => w != null && w > 0);
      return {
        lot,
        rolls: items,
        fabricType: items[0]?.fabric_type,
        colorName: items[0]?.color_name,
        standardWeightKg: median(weights),
      };
    });
  }, [rolls]);

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Kho vải thành phẩm</p>
            <h3>Danh sách cuộn thành phẩm</h3>
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
            onClick={() => exportExcel(rolls)}
            disabled={rolls.length === 0}
            title="Xuất danh sách hiện tại ra Excel"
          >
            📊 Excel
          </button>
          <button
            className="btn-secondary btn-standard"
            type="button"
            onClick={() => exportPdf(rolls)}
            disabled={rolls.length === 0}
            title="Xuất danh sách hiện tại ra PDF"
          >
            🖨 PDF
          </button>
        </div>
      </div>

      {/* Thống kê nhanh */}
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

      {/* Bộ lọc */}
      <div className="filter-bar card-filter-section">
        <form
          className="filter-field"
          onSubmit={handleFabricTypeSearch}
          style={{ flex: '1 1 200px' }}
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

        {(filters.status ?? filters.quality_grade ?? filters.fabric_type) && (
          <button
            className="btn-secondary"
            type="button"
            onClick={() => {
              setFilters({});
              setFabricTypeInput('');
            }}
            style={{ alignSelf: 'flex-end' }}
          >
            ✕ Xóa lọc
          </button>
        )}
      </div>

      {/* Thông báo lỗi */}
      {error && (
        <p className="error-inline">
          Lỗi tải dữ liệu: {(error as Error).message}
        </p>
      )}

      {/* Bảng dữ liệu / Lưới dữ liệu */}
      <div className="card-table-section">
        {isLoading ? (
          <p className="table-empty">Đang tải...</p>
        ) : rolls.length === 0 ? (
          <p className="table-empty">
            Chưa có cuộn thành phẩm nào. Nhấn "+ Nhập cuộn mới" để bắt đầu.
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
                standardWeightKg={group.standardWeightKg}
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
                  <th>Mã cuộn</th>
                  <th>Loại vải</th>
                  <th>CL</th>
                  <th>Khổ × Dài</th>
                  <th>Trọng lượng</th>
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
                        title="Truy vết nguồn gốc"
                        onClick={() => onTrace(roll)}
                        style={{ marginRight: 4 }}
                      >
                        🔗
                      </button>
                      <button
                        className="btn-icon"
                        type="button"
                        title={editBlockReason(roll.status) ?? 'Sửa'}
                        onClick={() => onEdit(roll)}
                        disabled={!canEditRoll(roll.status)}
                        style={{ marginRight: 4 }}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon danger"
                        type="button"
                        title={deleteBlockReason(roll.status) ?? 'Xóa'}
                        onClick={() => handleDelete(roll)}
                        disabled={
                          deleteMutation.isPending ||
                          !canDeleteRoll(roll.status)
                        }
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
