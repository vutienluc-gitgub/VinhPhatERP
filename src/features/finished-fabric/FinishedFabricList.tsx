import { useState, useMemo } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import { Pagination } from '@/shared/components/Pagination';
import {
  Icon,
  Badge,
  type BadgeVariant,
  DataTablePremium,
  ViewToggle,
  type ViewMode,
  AddButton,
  Button,
  ActionBar,
  FilterBarPremium,
  type FilterFieldConfig,
} from '@/shared/components';
import { useUrlFilterState } from '@/shared/hooks/useUrlFilterState';
import { LotMatrixCard } from '@/shared/components/roll-grid';
import {
  useDeleteFinishedFabric,
  useFinishedFabricList,
  useFinishedFabricStats,
} from '@/application/inventory';
import { useFinishedFabricExport } from '@/application/inventory';
import {
  QUALITY_GRADE_LABELS,
  QUALITY_GRADES,
  ROLL_STATUS_LABELS,
  ROLL_STATUSES,
} from '@/schema/finished-fabric.schema';

import {
  canDeleteRoll,
  canEditRoll,
  deleteBlockReason,
  editBlockReason,
} from './transitions';
import type {
  FinishedFabricFilter,
  FinishedFabricRoll,
  RollStatus,
} from './types';

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
  const { filters, setFilter, clearFilters } = useUrlFilterState([
    'fabric_type',
    'status',
    'quality_grade',
  ]);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const {
    data: result,
    isLoading,
    error,
  } = useFinishedFabricList(filters as FinishedFabricFilter, page);
  const rolls = useMemo(() => result?.data ?? [], [result?.data]);
  const { data: stats } = useFinishedFabricStats();
  const deleteMutation = useDeleteFinishedFabric();
  const { confirm } = useConfirm();
  const { exportExcel } = useFinishedFabricExport();

  async function handleDelete(roll: FinishedFabricRoll) {
    if (!canDeleteRoll(roll.status)) return;
    const ok = await confirm({
      message: `Xóa cuộn "${roll.roll_number}"? Hành động này không thể hoàn tác.`,
      variant: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(roll.id);
  }

  const median = (values: number[]) => {
    if (values.length === 0) return undefined;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1]! + sorted[mid]!) / 2;
  };

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

  const filterSchema: FilterFieldConfig[] = [
    {
      key: 'fabric_type',
      type: 'search',
      label: 'Loại vải',
      placeholder: 'Tìm loại vải...',
    },
    {
      key: 'status',
      type: 'combobox',
      label: 'Trạng thái',
      options: ROLL_STATUSES.map((s) => ({
        value: s,
        label: ROLL_STATUS_LABELS[s],
      })),
    },
    {
      key: 'quality_grade',
      type: 'combobox',
      label: 'Chất lượng',
      options: QUALITY_GRADES.map((g) => ({
        value: g,
        label: QUALITY_GRADE_LABELS[g],
      })),
    },
  ];

  function handleFilterChange(key: string, value: string | undefined) {
    setPage(1);
    setFilter(key, value);
  }

  return (
    <div className="panel-card card-flush">
      {/* Action bar */}
      <div className="card-header-area">
        <div className="flex items-center gap-4">
          <ViewToggle value={viewMode} onChange={setViewMode} />

          <div className="flex gap-2">
            <AddButton onClick={onNew} label="Nhập mới" />
            <Button
              variant="secondary"
              leftIcon="Zap"
              className="btn-standard"
              type="button"
              onClick={onBulkNew}
            >
              Nhập mẻ
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <button
              className="btn-icon btn-standard"
              type="button"
              onClick={() => exportExcel(rolls)}
              disabled={rolls.length === 0}
              title="Xuất Excel"
            >
              <Icon name="FileSpreadsheet" size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Dashboard */}
      {stats && (
        <div className="kpi-section kpi-grid">
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
            <div className="kpi-footer text-xs opacity-80 italic">
              Cuộn đã hoàn tất công đoạn nhuộm
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
              Đã kiểm tra chất lượng (QC)
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
              Trọng lượng tịnh xuất kho
            </div>
          </div>
        </div>
      )}

      {/* Filters (Config-Driven) */}
      <FilterBarPremium
        schema={filterSchema}
        value={filters}
        onChange={handleFilterChange}
        onClear={() => {
          clearFilters();
          setPage(1);
        }}
      />

      {error && (
        <div className="p-4">
          <p className="error-inline">
            Lỗi tải dữ liệu:{' '}
            {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      )}

      {/* Main Content View */}
      {viewMode === 'grid' ? (
        <div className="card-table-section p-4 flex flex-col gap-6">
          {isLoading ? (
            <div className="flex-center py-20">
              <div className="spinner" />
            </div>
          ) : rolls.length === 0 ? (
            <div className="empty-state py-20">
              <div className="empty-icon">
                <Icon name="Package" size={48} />
              </div>
              <p>Chưa có cuộn thành phẩm nào.</p>
            </div>
          ) : (
            groupedRolls.map((group) => (
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
                  raw_roll_number: r.raw_roll_number ?? undefined,
                }))}
                standardWeightKg={group.standardWeightKg}
                mode="view"
                onRollPress={(roll) => {
                  const original = rolls.find((r) => r.id === roll.id);
                  if (original) onEdit(original);
                }}
              />
            ))
          )}
        </div>
      ) : (
        <DataTablePremium
          data={rolls}
          isLoading={isLoading}
          rowKey={(r) => r.id}
          onRowClick={(r) => {
            if (canEditRoll(r.status)) onEdit(r);
          }}
          emptyStateTitle="Không có dữ liệu"
          emptyStateIcon="Package"
          columns={[
            {
              header: 'Mã cuộn',
              id: 'roll_number',
              sortable: true,
              cell: (r) => (
                <div className="flex flex-col">
                  <span className="font-bold text-primary">
                    {r.roll_number}
                  </span>
                  {r.color_name && (
                    <span className="text-xs text-muted">{r.color_name}</span>
                  )}
                </div>
              ),
            },
            {
              header: 'Loại vải',
              id: 'fabric_type',
              sortable: true,
              cell: (r) => r.fabric_type,
            },
            {
              header: 'CL',
              id: 'quality_grade',
              sortable: true,
              cell: (r) =>
                r.quality_grade ? (
                  <span className={`grade-badge grade-${r.quality_grade}`}>
                    {r.quality_grade}
                  </span>
                ) : (
                  <span className="text-muted">—</span>
                ),
            },
            {
              header: 'Khổ × Dài',
              id: 'length_m',
              sortable: true,
              className: 'text-muted',
              cell: (r) => (
                <div className="flex flex-col text-xs">
                  <span>{r.width_cm !== null ? `${r.width_cm} cm` : '—'}</span>
                  <span>
                    {r.length_m !== null && ` × ${formatNum(r.length_m, 'm')}`}
                  </span>
                </div>
              ),
            },
            {
              header: 'Trọng lượng',
              id: 'weight_kg',
              sortable: true,
              className: 'text-right',
              cell: (r) => (
                <span className="font-medium">
                  {formatNum(r.weight_kg, 'kg')}
                </span>
              ),
            },
            {
              header: 'Trạng thái',
              id: 'status',
              sortable: true,
              cell: (r) => (
                <Badge variant={getStatusVariant(r.status)}>
                  {ROLL_STATUS_LABELS[r.status]}
                </Badge>
              ),
            },
            {
              header: 'Vị trí',
              id: 'warehouse_location',
              sortable: true,
              cell: (r) => (
                <span className="text-xs text-muted">
                  {r.warehouse_location ?? '—'}
                </span>
              ),
            },
            {
              header: 'Thao tác',
              className: 'text-right',
              onCellClick: () => {},
              cell: (r) => (
                <ActionBar
                  actions={[
                    {
                      icon: 'Link',
                      onClick: () => onTrace(r),
                      title: 'Truy vết',
                    },
                    {
                      icon: 'Pencil',
                      onClick: () => onEdit(r),
                      title: editBlockReason(r.status) ?? 'Sửa',
                      disabled: !canEditRoll(r.status),
                    },
                    {
                      icon: 'Trash2',
                      onClick: () => handleDelete(r),
                      title: deleteBlockReason(r.status) ?? 'Xóa',
                      variant: 'danger',
                      disabled:
                        deleteMutation.isPending || !canDeleteRoll(r.status),
                    },
                  ]}
                />
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
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-bold">{r.fabric_type}</span>
                  <span className="text-xs text-muted">{r.color_name}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-muted">
                      Trọng lượng
                    </span>
                    <span className="text-sm font-medium">
                      {formatNum(r.weight_kg, 'kg')}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-muted">
                      Chất lượng
                    </span>
                    <span className="text-sm font-bold">
                      {r.quality_grade || '—'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-border/10">
                <button
                  className="btn-secondary flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTrace(r);
                  }}
                >
                  <Icon name="Link" size={16} /> Truy vết
                </button>
                {canEditRoll(r.status) && (
                  <button
                    className="btn-secondary flex-1 text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(r);
                    }}
                  >
                    <Icon name="Pencil" size={16} /> Sửa
                  </button>
                )}
                {canDeleteRoll(r.status) && (
                  <button
                    className="btn-secondary text-danger px-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(r);
                    }}
                  >
                    <Icon name="Trash2" size={16} />
                  </button>
                )}
              </div>
            </div>
          )}
        />
      )}

      <div className="p-4">
        <Pagination result={result} onPageChange={setPage} />
      </div>
    </div>
  );
}
