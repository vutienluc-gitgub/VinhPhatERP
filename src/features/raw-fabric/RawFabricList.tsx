import { useMemo, useState } from 'react';

import { Pagination } from '@/shared/components/Pagination';
import { fetchRawFabricAll } from '@/api/raw-fabric.api';
import { Icon, Badge, type BadgeVariant } from '@/shared/components';
import { Combobox } from '@/shared/components/Combobox';
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

function getStatusVariant(status: RollStatus): BadgeVariant {
  switch (status) {
    case 'in_stock':
      return 'success';
    case 'reserved':
      return 'info';
    case 'in_process':
      return 'purple';
    case 'shipped':
      return 'gray';
    case 'damaged':
      return 'danger';
    case 'written_off':
      return 'gray';
    default:
      return 'gray';
  }
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

      {/* Stats Section - Dashboard Style */}
      {stats && (
        <div className="kpi-grid p-4 md:p-6 bg-surface-subtle border-b border-border">
          <div className="kpi-card-premium kpi-primary">
            <div className="kpi-overlay" />
            <div className="kpi-content">
              <div className="kpi-info">
                <p className="kpi-label">Tổng số cuộn</p>
                <p className="kpi-value">
                  {stats.totalRolls.toLocaleString('vi-VN')}
                </p>
              </div>
              <div className="kpi-icon-box">
                <Icon name="Package" size={32} strokeWidth={1.5} />
              </div>
            </div>
            <div className="kpi-footer">
              <span className="text-xs opacity-80 italic">
                Số lượng cuộn vải mộc hiện có
              </span>
            </div>
          </div>

          <div className="kpi-card-premium kpi-success">
            <div className="kpi-overlay" />
            <div className="kpi-content">
              <div className="kpi-info">
                <p className="kpi-label">Tổng chiều dài</p>
                <div className="flex items-baseline gap-1">
                  <p className="kpi-value">
                    {stats.totalLengthM.toLocaleString('vi-VN', {
                      maximumFractionDigits: 1,
                    })}
                  </p>
                  <span className="text-lg font-bold opacity-80 uppercase">
                    m
                  </span>
                </div>
              </div>
              <div className="kpi-icon-box">
                <Icon name="Ruler" size={32} strokeWidth={1.5} />
              </div>
            </div>
            <div className="kpi-footer">
              <span className="text-xs opacity-80 italic">
                Sẵn sàng để đưa vào nhuộm
              </span>
            </div>
          </div>

          <div className="kpi-card-premium kpi-warning">
            <div className="kpi-overlay" />
            <div className="kpi-content">
              <div className="kpi-info">
                <p className="kpi-label">Tổng khối lượng</p>
                <div className="flex items-baseline gap-1">
                  <p className="kpi-value">
                    {stats.totalWeightKg.toLocaleString('vi-VN', {
                      maximumFractionDigits: 1,
                    })}
                  </p>
                  <span className="text-lg font-bold opacity-80 uppercase">
                    kg
                  </span>
                </div>
              </div>
              <div className="kpi-icon-box">
                <Icon name="Weight" size={32} strokeWidth={1.5} />
              </div>
            </div>
            <div className="kpi-footer">
              <span className="text-xs opacity-80 italic">
                Trọng lượng tịnh thực tế
              </span>
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
            <Combobox
              options={[
                {
                  value: '',
                  label: 'Tất cả trạng thái',
                },
                ...ROLL_STATUSES.map((s) => ({
                  value: s,
                  label: ROLL_STATUS_LABELS[s],
                })),
              ]}
              value={filters.status ?? ''}
              onChange={(val) => {
                setPage(1);
                setFilters((prev) => ({
                  ...prev,
                  status: (val as RollStatus) || undefined,
                }));
              }}
            />
          </div>

          <div className="filter-field">
            <label>Chất lượng</label>
            <Combobox
              options={[
                {
                  value: '',
                  label: 'Tất cả loại',
                },
                ...QUALITY_GRADES.map((g) => ({
                  value: g,
                  label: QUALITY_GRADE_LABELS[g],
                })),
              ]}
              value={filters.quality_grade ?? ''}
              onChange={(val) => {
                setPage(1);
                setFilters((prev) => ({
                  ...prev,
                  quality_grade: (val as QualityGrade) || undefined,
                }));
              }}
            />
          </div>
        </div>

        {hasFilter && (
          <button
            className="btn-secondary mt-4 text-danger border-danger/20 flex items-center gap-2"
            type="button"
            onClick={() => {
              setFilters({});
              setFabricTypeInput('');
              setRollNumberInput('');
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
      <div className="card-table-section min-h-[400px]">
        {isLoading ? (
          <div className="flex-center py-20">
            <div className="spinner" />
          </div>
        ) : rolls.length === 0 ? (
          <div className="empty-state py-20">
            <div className="empty-icon">
              <Icon name="Layers" size={48} />
            </div>
            <p>
              {hasFilter
                ? 'Không tìm thấy cuộn vải phù hợp.'
                : 'Chưa có cuộn vải nào. Nhấn "+ Nhập cuộn mới" để bắt đầu.'}
            </p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            {/* Desktop Table */}
            <table className="data-table hidden md:table">
              <thead>
                <tr>
                  <th>Mã cuộn</th>
                  <th>Số lô</th>
                  <th>Loại vải / Màu</th>
                  <th className="text-right">Khối lượng</th>
                  <th className="text-right">Chiều dài</th>
                  <th>Trạng thái</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rolls.map((roll) => (
                  <tr
                    key={roll.id}
                    className="hover:bg-surface-subtle transition-colors cursor-pointer"
                    onClick={() => onEdit(roll)}
                  >
                    <td>
                      <span className="font-bold text-primary">
                        {roll.roll_number}
                      </span>
                    </td>
                    <td className="font-medium text-muted">
                      {roll.lot_number || '—'}
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-medium">{roll.fabric_type}</span>
                        <span className="text-xs text-muted">
                          {roll.color_name}
                        </span>
                      </div>
                    </td>
                    <td className="numeric-cell font-medium">
                      {roll.weight_kg?.toLocaleString()}
                      <span className="text-xs ml-1 text-muted">kg</span>
                    </td>
                    <td className="numeric-cell font-medium text-success">
                      {roll.length_m?.toLocaleString()}
                      <span className="text-xs ml-1 text-muted">m</span>
                    </td>
                    <td>
                      <Badge variant={getStatusVariant(roll.status)}>
                        {ROLL_STATUS_LABELS[roll.status]}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <button className="btn-icon">
                        <Icon name="Pencil" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Cards (for Table mode) */}
            <div className="md:hidden space-y-3 p-2">
              {rolls.map((roll) => (
                <div
                  key={roll.id}
                  className="mobile-card"
                  onClick={() => onEdit(roll)}
                >
                  <div className="mobile-card-header">
                    <span className="mobile-card-title">
                      {roll.roll_number}
                    </span>
                    <Badge variant={getStatusVariant(roll.status)}>
                      {ROLL_STATUS_LABELS[roll.status]}
                    </Badge>
                  </div>
                  <div className="mobile-card-body">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">
                        {roll.fabric_type}
                      </span>
                      <span className="text-xs text-muted">
                        Lô: {roll.lot_number || '—'}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-muted">
                          Khối lượng
                        </span>
                        <span className="font-bold text-sm">
                          {roll.weight_kg} kg
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-muted">
                          Chiều dài
                        </span>
                        <span className="font-bold text-sm text-success">
                          {roll.length_m} m
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
