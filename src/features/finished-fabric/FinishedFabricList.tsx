import { useState } from 'react';
import { useMemo } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import { Pagination } from '@/shared/components/Pagination';
import { Icon, Badge, type BadgeVariant } from '@/shared/components';
import { Combobox } from '@/shared/components/Combobox';
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

      {/* Stats Section - Premium Dashboard */}
      {stats && (
        <div className="kpi-grid p-4 md:p-6 bg-surface-subtle border-b border-border">
          <div className="kpi-card-premium kpi-primary">
            <div className="kpi-overlay" />
            <div className="kpi-content">
              <div className="kpi-info">
                <p className="kpi-label">Tổng thành phẩm</p>
                <p className="kpi-value">
                  {stats.totalRolls.toLocaleString('vi-VN')}
                </p>
              </div>
              <div className="kpi-icon-box">
                <Icon name="Package" size={32} />
              </div>
            </div>
            <div className="kpi-footer">
              <span className="text-xs opacity-80 italic">
                Cuộn đã hoàn tất công đoạn nhuộm
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
                <Icon name="Ruler" size={32} />
              </div>
            </div>
            <div className="kpi-footer">
              <span className="text-xs opacity-80 italic">
                Đã kiểm tra chất lượng (QC)
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
                <Icon name="Weight" size={32} />
              </div>
            </div>
            <div className="kpi-footer">
              <span className="text-xs opacity-80 italic">
                Trọng lượng tịnh xuất kho
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className="filter-bar card-filter-section">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

        {(filters.status ?? filters.quality_grade ?? filters.fabric_type) && (
          <button
            className="btn-secondary mt-4 text-danger border-danger/20 flex items-center gap-2"
            type="button"
            onClick={() => {
              setFilters({});
              setFabricTypeInput('');
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
                      <Badge variant={getStatusVariant(roll.status)}>
                        {ROLL_STATUS_LABELS[roll.status]}
                      </Badge>
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
