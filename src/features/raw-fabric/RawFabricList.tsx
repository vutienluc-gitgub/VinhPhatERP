import { useMemo, useState } from 'react';

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
import { useRawFabricList, useRawFabricStats } from './useRawFabric';
import { useRawFabricExport } from './useRawFabricExport';

type RawFabricListProps = {
  onEdit: (roll: RawFabricRoll) => void;
  onNew: () => void;
  onBulkNew: () => void;
};

export function RawFabricList({
  onEdit,
  onNew,
  onBulkNew,
}: RawFabricListProps) {
  const [filters, setFilters] = useState<RawFabricFilter>({});
  const [fabricTypeInput, setFabricTypeInput] = useState('');
  const [rollNumberInput, setRollNumberInput] = useState('');
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');

  const activeFilters: RawFabricFilter = { ...filters };

  const {
    data: result,
    isLoading,
    error,
  } = useRawFabricList(activeFilters, page);
  const rolls = useMemo(() => result?.data ?? [], [result?.data]);
  const { data: stats } = useRawFabricStats();
  const { exportExcel } = useRawFabricExport();

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

  // Search logic is handled inline or on blur.

  async function handleExportExcel() {
    setIsExporting(true);
    try {
      const all = await fetchRawFabricAll(filters);
      exportExcel(all);
    } finally {
      setIsExporting(false);
    }
  }

  // exportPdf removed as it's unused

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
    return Array.from(map.entries()).map(([lot, items]) => {
      // Calculate median weight for anomaly reference
      const weights = items
        .map((r) => r.weight_kg)
        .filter((w): w is number => !!w && w > 0)
        .sort((a, b) => a - b);
      let median: number | undefined;
      if (weights.length > 0) {
        median = weights[Math.floor(weights.length / 2)];
      }

      return {
        lot,
        rolls: items,
        fabricType: items[0]?.fabric_type,
        colorName: items[0]?.color_name,
        medianWeight: median,
      };
    });
  }, [rolls]);

  return (
    <div className="panel-card card-flush">
      {/* Header Area */}
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">KHO VẢI MỘC</p>
          <h3 className="title-premium">Quản lý cuộn vải mộc</h3>
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
              onClick={() => void handleExportExcel()}
              disabled={isExporting}
              title="Xuất Excel"
              style={{
                height: '42px',
                width: '42px',
              }}
            >
              {isExporting ? (
                <Icon name="Loader2" size={18} className="animate-spin" />
              ) : (
                <Icon name="FileSpreadsheet" size={18} />
              )}
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
            <label>Mã cuộn</label>
            <div className="search-input-wrapper">
              <input
                className="field-input"
                type="text"
                placeholder="VD: BGR-001..."
                value={rollNumberInput}
                onChange={(e) => setRollNumberInput(e.target.value)}
                onBlur={() => {
                  setFilters((prev) => ({
                    ...prev,
                    roll_number: rollNumberInput.trim() || undefined,
                  }));
                  setPage(1);
                }}
              />
              <Icon name="Tag" size={16} className="search-input-icon" />
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

        {hasFilter && (
          <button
            className="btn-secondary"
            type="button"
            onClick={() => {
              setFilters({});
              setFabricTypeInput('');
              setRollNumberInput('');
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
        ) : (
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
                standardWeightKg={group.medianWeight}
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
        )}
      </div>

      <Pagination result={result} onPageChange={setPage} />
    </div>
  );
}
