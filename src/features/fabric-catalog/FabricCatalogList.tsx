import { useState } from 'react';

import { Combobox } from '@/shared/components/Combobox';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  Icon,
  Badge,
  type BadgeVariant,
  DataTablePremium,
  AddButton,
  ClearFilterButton,
  ActionBar,
} from '@/shared/components';
import { Pagination } from '@/shared/components/Pagination';

import { FABRIC_CATALOG_STATUS_LABELS } from './fabric-catalog.module';
import type {
  FabricCatalog,
  FabricCatalogFilter,
  FabricCatalogStatus,
} from './types';
import {
  useDeleteFabricCatalog,
  useFabricCatalogList,
} from './useFabricCatalog';

type FabricCatalogListProps = {
  onEdit: (catalog: FabricCatalog) => void;
  onNew: () => void;
};

function getStatusVariant(status: FabricCatalogStatus): BadgeVariant {
  return status === 'active' ? 'success' : 'gray';
}

export function FabricCatalogList({ onEdit, onNew }: FabricCatalogListProps) {
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<FabricCatalogFilter>({});
  const [page, setPage] = useState(1);

  const { data, isLoading } = useFabricCatalogList(filters, page);
  const deleteMutation = useDeleteFabricCatalog();
  const { confirm } = useConfirm();

  const catalogs = data?.data ?? [];

  // 📊 Stats for KPI Dashboard (based on current data/all)
  const stats = {
    total: data?.total ?? 0,
    active: catalogs.filter((c) => c.status === 'active').length, // Simple logic for current page
  };

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      search: searchInput.trim() || undefined,
    }));
  }

  async function handleDelete(catalog: FabricCatalog) {
    const ok = await confirm({
      message: `Xóa loại vải "${catalog.name}"? Hành động này không thể hoàn tác.`,
      variant: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(catalog.id);
  }

  const hasFilter = !!(filters.search || filters.status);

  return (
    <div className="panel-card card-flush">
      {/* 🏷️ Header Area */}
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">DANH MỤC TRUNG TÂM</p>
          <h3 className="title-premium">Danh mục loại vải</h3>
        </div>
        <AddButton onClick={onNew} label="Thêm loại vải" />
      </div>

      {/* 📊 KPI Dashboard area */}
      <div className="kpi-grid p-4 md:p-6 bg-surface-subtle border-b border-border">
        <div className="kpi-card-premium kpi-primary">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Tổng loại vải</p>
              <p className="kpi-value">{stats.total}</p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Layers" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Toàn bộ danh mục hệ thống
          </div>
        </div>

        <div className="kpi-card-premium kpi-success">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Đang hoạt động</p>
              <p className="kpi-value">
                {catalogs.filter((c) => c.status === 'active').length}
              </p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Activity" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Trên trang hiện tại
          </div>
        </div>

        <div className="kpi-card-premium kpi-secondary">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Thành phần chính</p>
              <p className="kpi-value">Cotton/Pol</p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Zap" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Được ưa chuộng nhất
          </div>
        </div>
      </div>

      {/* 🔍 Filter Area */}
      <div className="filter-bar card-filter-section p-4 border-b border-border">
        <div className="filter-compact-premium">
          <div className="filter-field">
            <label htmlFor="filter-fabric-search">Tìm kiếm</label>
            <form className="search-input-wrapper" onSubmit={handleSearch}>
              <input
                id="filter-fabric-search"
                className="field-input"
                type="text"
                placeholder="Tên, mã, thành phần..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="submit" className="hidden" />
              <Icon name="Search" size={16} className="search-input-icon" />
            </form>
          </div>

          <div className="filter-field">
            <label>Trạng thái</label>
            <Combobox
              options={[
                {
                  value: '',
                  label: 'Tất cả trạng thái',
                },
                {
                  value: 'active',
                  label: 'Đang hoạt động',
                },
                {
                  value: 'inactive',
                  label: 'Ngưng sử dụng',
                },
              ]}
              value={filters.status ?? ''}
              onChange={(val) => {
                setPage(1);
                setFilters((prev) => ({
                  ...prev,
                  status: (val as FabricCatalogStatus) || undefined,
                }));
              }}
            />
          </div>

          {hasFilter && (
            <ClearFilterButton
              onClick={() => {
                setFilters({});
                setSearchInput('');
                setPage(1);
              }}
            />
          )}
        </div>
      </div>

      {/* 📑 Data Section */}
      <DataTablePremium
        data={catalogs}
        isLoading={isLoading}
        rowKey={(c) => c.id}
        onRowClick={(c) => onEdit(c)}
        emptyStateTitle={
          hasFilter ? 'Không tìm thấy loại vải phù hợp' : 'Chưa có loại vải nào'
        }
        emptyStateIcon={hasFilter ? '🔍' : 'Layers'}
        columns={[
          {
            header: 'Mã',
            cell: (c) => (
              <span className="font-bold text-primary">{c.code}</span>
            ),
          },
          {
            header: 'Tên loại vải',
            cell: (c) => <span className="font-medium">{c.name}</span>,
          },
          {
            header: 'Thành phần',
            cell: (c) => (
              <span className="text-muted text-sm italic">
                {c.composition ?? '—'}
              </span>
            ),
          },
          {
            header: 'Đơn vị',
            cell: (c) => <span className="text-sm">{c.unit}</span>,
          },
          {
            header: 'Trạng thái',
            cell: (c) => (
              <Badge variant={getStatusVariant(c.status)}>
                {FABRIC_CATALOG_STATUS_LABELS[c.status]}
              </Badge>
            ),
          },
          {
            header: 'Thao tác',
            className: 'text-right',
            onCellClick: () => {},
            cell: (c) => (
              <ActionBar
                actions={[
                  {
                    icon: 'Pencil',
                    onClick: () => onEdit(c),
                    title: 'Chỉnh sửa',
                  },
                  {
                    icon: 'Trash2',
                    onClick: () => handleDelete(c),
                    title: 'Xóa',
                    variant: 'danger',
                    disabled: deleteMutation.isPending,
                  },
                ]}
              />
            ),
          },
        ]}
        renderMobileCard={(c) => (
          <div className="mobile-card">
            <div className="mobile-card-header">
              <span className="mobile-card-title">{c.code}</span>
              <Badge variant={getStatusVariant(c.status)}>
                {FABRIC_CATALOG_STATUS_LABELS[c.status]}
              </Badge>
            </div>
            <div className="mobile-card-body space-y-2">
              <p className="font-bold text-sm">{c.name}</p>
              <p className="text-xs text-muted italic">
                {c.composition || '—'}
              </p>
              <div className="flex justify-between items-center text-xs text-muted pt-2 border-t border-border/10">
                <span>Đơn vị: {c.unit}</span>
                <div className="flex gap-2">
                  <button
                    className="btn-icon p-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(c);
                    }}
                  >
                    <Icon name="Pencil" size={16} />
                  </button>
                  <button
                    className="btn-icon p-1 text-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(c);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Icon name="Trash2" size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      />

      <div className="p-4">
        <Pagination result={data} onPageChange={setPage} />
      </div>
    </div>
  );
}
