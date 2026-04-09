import { useMemo, useState } from 'react';

import { Pagination } from '@/shared/components/Pagination';
import { fetchRawFabricAll } from '@/api/raw-fabric.api';
import {
  Icon,
  Badge,
  type BadgeVariant,
  DataTablePremium,
} from '@/shared/components';
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

  const { data: result, isLoading, error } = useRawFabricList(filters, page);
  const rolls = useMemo(() => result?.data ?? [], [result?.data]);
  const { data: stats } = useRawFabricStats();
  const { exportExcel } = useRawFabricExport();

  async function handleExportExcel() {
    setIsExporting(true);
    try {
      const all = await fetchRawFabricAll(filters);
      exportExcel(all);
    } finally {
      setIsExporting(false);
    }
  }

  const hasFilter = !!(
    filters.status ||
    filters.quality_grade ||
    filters.fabric_type ||
    filters.roll_number
  );

  const groupedRolls = useMemo(() => {
    const map = new Map<string, RawFabricRoll[]>();
    rolls.forEach((roll) => {
      const key = roll.lot_number || 'KHÔNG CÓ LÔ';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(roll);
    });
    return Array.from(map.entries()).map(([lot, items]) => {
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

        <div className="flex items-center gap-4">
          <div className="inline-flex gap-1 bg-surface-subtle p-1 rounded-lg border border-border">
            <button
              className={`btn-icon ${viewMode === 'table' ? 'bg-surface-strong shadow-sm text-primary' : 'text-muted'}`}
              onClick={() => setViewMode('table')}
              title="Dạng bảng"
              style={{
                width: 36,
                height: 36,
                border: 'none',
              }}
            >
              <Icon name="LayoutList" size={20} />
            </button>
            <button
              className={`btn-icon ${viewMode === 'grid' ? 'bg-surface-strong shadow-sm text-primary' : 'text-muted'}`}
              onClick={() => setViewMode('grid')}
              title="Dạng lưới"
              style={{
                width: 36,
                height: 36,
                border: 'none',
              }}
            >
              <Icon name="LayoutGrid" size={20} />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              className="btn-primary"
              type="button"
              onClick={onNew}
              style={{
                minHeight: 42,
                padding: '0 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Icon name="Plus" size={18} /> Nhập mới
            </button>
            <button
              className="btn-secondary"
              type="button"
              onClick={onBulkNew}
              style={{
                height: 42,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Icon name="Zap" size={16} /> Nhập mẻ
            </button>
            <div className="w-px h-6 bg-border mx-1" />
            <button
              className="btn-icon"
              type="button"
              onClick={() => void handleExportExcel()}
              disabled={isExporting}
              title="Xuất Excel"
              style={{
                height: 42,
                width: 42,
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

      {/* KPI Dashboard */}
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
                <Icon name="Package" size={32} />
              </div>
            </div>
            <div className="kpi-footer text-xs opacity-80 italic">
              Số lượng cuộn vải mộc hiện có
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
                <Icon name="Ruler" size={32} />
              </div>
            </div>
            <div className="kpi-footer text-xs opacity-80 italic">
              Sẵn sàng để đưa vào nhuộm
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
                <Icon name="Weight" size={32} />
              </div>
            </div>
            <div className="kpi-footer text-xs opacity-80 italic">
              Trọng lượng tịnh thực tế
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar card-filter-section p-4 border-b border-border">
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
            className="btn-secondary text-danger border-danger/20 flex items-center gap-2"
            type="button"
            onClick={() => {
              setFilters({});
              setFabricTypeInput('');
              setRollNumberInput('');
              setPage(1);
            }}
            style={{ marginTop: '1rem' }}
          >
            <Icon name="X" size={14} /> Xóa lọc nhanh
          </button>
        )}
      </div>

      {error && (
        <div className="p-4">
          <p className="error-inline">
            Lỗi tải dữ liệu: {(error as Error).message}
          </p>
        </div>
      )}

      {/* Main Content View */}
      <div className="card-table-section min-h-[400px]">
        {viewMode === 'table' ? (
          <DataTablePremium
            data={rolls}
            isLoading={isLoading}
            rowKey={(r) => r.id}
            onRowClick={(r) => onEdit(r)}
            emptyStateTitle={
              hasFilter
                ? 'Không tìm thấy cuộn vải phù hợp'
                : 'Chưa có cuộn vải nào'
            }
            emptyStateIcon={hasFilter ? '🔍' : 'Layers'}
            columns={[
              {
                header: 'Mã cuộn',
                cell: (r) => (
                  <span className="font-bold text-primary">
                    {r.roll_number}
                  </span>
                ),
              },
              {
                header: 'Số lô',
                cell: (r) => (
                  <span className="font-medium text-muted">
                    {r.lot_number || '—'}
                  </span>
                ),
              },
              {
                header: 'Loại vải / Màu',
                cell: (r) => (
                  <div className="flex flex-col">
                    <span className="font-medium">{r.fabric_type}</span>
                    <span className="text-xs text-muted">{r.color_name}</span>
                  </div>
                ),
              },
              {
                header: 'Khối lượng',
                className: 'text-right',
                cell: (r) => (
                  <span className="font-medium">
                    {r.weight_kg?.toLocaleString()}
                    <span className="text-xs ml-1 text-muted">kg</span>
                  </span>
                ),
              },
              {
                header: 'Chiều dài',
                className: 'text-right',
                cell: (r) => (
                  <span className="font-medium text-success">
                    {r.length_m?.toLocaleString()}
                    <span className="text-xs ml-1 text-muted">m</span>
                  </span>
                ),
              },
              {
                header: 'Trạng thái',
                cell: (r) => (
                  <Badge variant={getStatusVariant(r.status)}>
                    {ROLL_STATUS_LABELS[r.status]}
                  </Badge>
                ),
              },
              {
                header: 'Thao tác',
                className: 'text-right',
                onCellClick: () => {},
                cell: (r) => (
                  <button className="btn-icon" onClick={() => onEdit(r)}>
                    <Icon name="Pencil" size={16} />
                  </button>
                ),
              },
            ]}
            renderMobileCard={(r) => (
              <div className="mobile-card">
                <div className="mobile-card-header">
                  <span className="mobile-card-title">{r.roll_number}</span>
                  <Badge variant={getStatusVariant(r.status)}>
                    {ROLL_STATUS_LABELS[r.status]}
                  </Badge>
                </div>
                <div className="mobile-card-body">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{r.fabric_type}</span>
                    <span className="text-xs text-muted">
                      Lô: {r.lot_number || '—'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-muted">
                        Khối lượng
                      </span>
                      <span className="font-bold text-sm">
                        {r.weight_kg} kg
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-muted">
                        Chiều dài
                      </span>
                      <span className="font-bold text-sm text-success">
                        {r.length_m} m
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          />
        ) : (
          <div className="p-4 flex flex-col gap-6">
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
                    : 'Chưa có cuộn vải nào.'}
                </p>
              </div>
            ) : (
              groupedRolls.map((group) => (
                <LotMatrixCard
                  key={group.lot}
                  title={group.lot}
                  lotNumber={
                    group.lot !== 'KHÔNG CÓ LÔ' ? group.lot : undefined
                  }
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
              ))
            )}
          </div>
        )}
      </div>

      <div className="p-4">
        <Pagination result={result} onPageChange={setPage} />
      </div>
    </div>
  );
}
