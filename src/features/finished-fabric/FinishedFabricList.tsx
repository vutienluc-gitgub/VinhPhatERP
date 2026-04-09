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
  const rolls = useMemo(() => result?.data ?? [], [result?.data]);
  const { data: stats } = useFinishedFabricStats();
  const deleteMutation = useDeleteFinishedFabric();
  const { confirm } = useConfirm();
  const { exportExcel } = useFinishedFabricExport();

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

  // Removed unused handleFabricTypeSearch

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
      {/* Header Area */}
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">KHO THÀNH PHẨM</p>
          <h3 className="title-premium">Quản lý cuộn thành phẩm</h3>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            className="view-toggle-group"
            style={{
              display: 'flex',
              gap: '0.25rem',
              background: 'var(--surface-subtle)',
              padding: '0.25rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
            }}
          >
            <button
              className={`btn-icon ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Dạng bảng"
              style={{
                width: '36px',
                height: '36px',
                background:
                  viewMode === 'table'
                    ? 'var(--surface-strong)'
                    : 'transparent',
                boxShadow:
                  viewMode === 'table' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                border: 'none',
                color: viewMode === 'table' ? 'var(--primary)' : 'var(--muted)',
              }}
            >
              <Icon name="LayoutList" size={20} />
            </button>
            <button
              className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Dạng lưới"
              style={{
                width: '36px',
                height: '36px',
                background:
                  viewMode === 'grid' ? 'var(--surface-strong)' : 'transparent',
                boxShadow:
                  viewMode === 'grid' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                border: 'none',
                color: viewMode === 'grid' ? 'var(--primary)' : 'var(--muted)',
              }}
            >
              <Icon name="LayoutGrid" size={20} />
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
            }}
          >
            <button
              className="btn-primary"
              type="button"
              onClick={onNew}
              style={{
                minHeight: '42px',
                padding: '0 1.25rem',
              }}
            >
              + Nhập mới
            </button>
            <button
              className="btn-secondary"
              type="button"
              onClick={onBulkNew}
              style={{ height: '42px' }}
            >
              <Icon name="Zap" size={16} /> Nhập mẻ
            </button>
            <div
              style={{
                width: '1px',
                height: '24px',
                background: 'var(--border)',
                margin: 'auto 0.25rem',
              }}
            />
            <button
              className="btn-icon"
              type="button"
              onClick={() => exportExcel(rolls)}
              disabled={rolls.length === 0}
              title="Xuất Excel"
              style={{
                height: '42px',
                width: '42px',
              }}
            >
              <Icon name="FileSpreadsheet" size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="stats-grid-premium">
          <div className="stat-item-premium">
            <div
              className="stat-icon-wrapper"
              style={{
                background: 'rgba(11, 107, 203, 0.1)',
                color: 'var(--primary)',
              }}
            >
              <Icon name="Package" size={24} />
            </div>
            <div className="stat-content-premium">
              <p>Tổng cuộn</p>
              <p>{stats.totalRolls.toLocaleString('vi-VN')}</p>
            </div>
          </div>

          <div className="stat-item-premium">
            <div
              className="stat-icon-wrapper"
              style={{
                background: 'rgba(10, 128, 92, 0.1)',
                color: 'var(--success)',
              }}
            >
              <Icon name="Ruler" size={24} />
            </div>
            <div className="stat-content-premium">
              <p>Tổng chiều dài</p>
              <p>
                {stats.totalLengthM.toLocaleString('vi-VN', {
                  maximumFractionDigits: 1,
                })}
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 500,
                    marginLeft: '0.2rem',
                  }}
                >
                  m
                </span>
              </p>
            </div>
          </div>

          <div className="stat-item-premium">
            <div
              className="stat-icon-wrapper"
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                color: '#f59e0b',
              }}
            >
              <Icon name="Weight" size={24} />
            </div>
            <div className="stat-content-premium">
              <p>Tổng trọng lượng</p>
              <p>
                {stats.totalWeightKg.toLocaleString('vi-VN', {
                  maximumFractionDigits: 1,
                })}
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 500,
                    marginLeft: '0.2rem',
                  }}
                >
                  kg
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className="filter-bar card-filter-section">
        <div className="filter-grid-premium">
          <div className="filter-field">
            <label>Loại vải</label>
            <div className="search-input-wrapper">
              <input
                className="field-input"
                type="text"
                placeholder="Tìm sản phẩm..."
                value={fabricTypeInput}
                onChange={(e) => setFabricTypeInput(e.target.value)}
                onBlur={() => {
                  setFilters((prev) => ({
                    ...prev,
                    fabric_type: fabricTypeInput.trim() || undefined,
                  }));
                  setPage(1);
                }}
              />
              <Icon name="Search" size={16} className="search-input-icon" />
            </div>
          </div>

          <div className="filter-field">
            <label>Trạng thái</label>
            <select
              className="field-select"
              value={filters.status ?? ''}
              onChange={handleStatusChange}
            >
              <option value="">Tất cả trạng thái</option>
              {ROLL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ROLL_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label>Chất lượng</label>
            <select
              className="field-select"
              value={filters.quality_grade ?? ''}
              onChange={handleGradeChange}
            >
              <option value="">Tất cả loại</option>
              {QUALITY_GRADES.map((g) => (
                <option key={g} value={g}>
                  {QUALITY_GRADE_LABELS[g]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(filters.status ?? filters.quality_grade ?? filters.fabric_type) && (
          <button
            className="btn-secondary"
            type="button"
            onClick={() => {
              setFilters({});
              setFabricTypeInput('');
            }}
            style={{
              marginTop: '1rem',
              color: 'var(--danger)',
              borderColor: 'rgba(192, 57, 43, 0.2)',
            }}
          >
            <Icon name="X" size={14} /> Xóa lọc nhanh
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
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.25rem',
                          justifyContent: 'flex-end',
                        }}
                      >
                        <button
                          className="btn-icon"
                          type="button"
                          title="Truy vết nguồn gốc"
                          onClick={() => onTrace(roll)}
                        >
                          <Icon name="Link" size={16} />
                        </button>
                        <button
                          className="btn-icon"
                          type="button"
                          title={editBlockReason(roll.status) ?? 'Sửa'}
                          onClick={() => onEdit(roll)}
                          disabled={!canEditRoll(roll.status)}
                        >
                          <Icon name="Edit3" size={16} />
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
                          <Icon name="Trash2" size={16} />
                        </button>
                      </div>
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
