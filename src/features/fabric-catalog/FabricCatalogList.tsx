import { useState } from 'react';

import { Combobox } from '@/shared/components/Combobox';
import { Icon } from '@/shared/components/Icon';
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

export function FabricCatalogList({ onEdit, onNew }: FabricCatalogListProps) {
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<FabricCatalogFilter>({});
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useFabricCatalogList(filters, page);
  const deleteMutation = useDeleteFabricCatalog();

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

  function handleDelete(catalog: FabricCatalog) {
    if (
      !window.confirm(
        `Xóa loại vải "${catalog.name}"? Hành động này không thể hoàn tác.`,
      )
    )
      return;
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
        <button
          className="btn-primary min-h-[42px] px-6"
          type="button"
          onClick={onNew}
        >
          <Icon name="Plus" size={18} className="mr-2" /> Thêm loại vải
        </button>
      </div>

      {/* 📊 KPI Dashboard area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 md:p-6 bg-surface-subtle border-b border-border">
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
            Được ưu chuộng nhất
          </div>
        </div>
      </div>

      {/* 🔍 Filter Area */}
      <div className="filter-bar card-filter-section p-4 border-b border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="filter-field">
            <label>Tìm kiếm nhanh</label>
            <form className="search-input-wrapper" onSubmit={handleSearch}>
              <input
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
        </div>

        {hasFilter && (
          <button
            className="btn-secondary mt-4 text-danger border-danger/20 flex items-center gap-2"
            type="button"
            onClick={() => {
              setFilters({});
              setSearchInput('');
              setPage(1);
            }}
          >
            <Icon name="X" size={14} /> Xóa lọc nhanh
          </button>
        )}
      </div>

      {/* 📑 Data Section */}
      <div className="card-table-section min-h-[400px]">
        {error && (
          <div className="p-4">
            <p className="error-inline">Lỗi: {(error as Error).message}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex-center py-20">
            <div className="spinner" />
          </div>
        ) : catalogs.length === 0 ? (
          <div className="py-20 text-center text-muted">
            <Icon name="Inbox" size={48} className="mx-auto mb-4 opacity-20" />
            <p>
              {hasFilter
                ? 'Không tìm thấy loại vải phù hợp.'
                : 'Chưa có loại vải nào. Hãy thêm mới ngay.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop Table View */}
            <table className="data-table hidden md:table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tên loại vải</th>
                  <th>Thành phần</th>
                  <th>Đơn vị</th>
                  <th>Trạng thái</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {catalogs.map((catalog) => (
                  <tr
                    key={catalog.id}
                    className="hover:bg-surface-subtle transition-colors"
                  >
                    <td>
                      <span className="font-bold text-primary">
                        {catalog.code}
                      </span>
                    </td>
                    <td className="font-medium">{catalog.name}</td>
                    <td className="text-muted text-sm italic">
                      {catalog.composition ?? '—'}
                    </td>
                    <td className="text-sm">{catalog.unit}</td>
                    <td>
                      <span
                        className={`status-badge ${catalog.status === 'active' ? 'status-active active' : 'status-inactive inactive'}`}
                      >
                        {FABRIC_CATALOG_STATUS_LABELS[catalog.status]}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          className="btn-icon"
                          onClick={() => onEdit(catalog)}
                          title="Chỉnh sửa"
                        >
                          <Icon name="Pencil" size={16} />
                        </button>
                        <button
                          className="btn-icon text-danger"
                          onClick={() => handleDelete(catalog)}
                          disabled={deleteMutation.isPending}
                          title="Xóa"
                        >
                          <Icon name="Trash2" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3 p-2">
              {catalogs.map((catalog) => (
                <div
                  key={catalog.id}
                  className="mobile-card"
                  onClick={() => onEdit(catalog)}
                >
                  <div className="mobile-card-header">
                    <span className="font-bold text-primary text-lg">
                      {catalog.code}
                    </span>
                    <span
                      className={`status-badge ${catalog.status === 'active' ? 'active' : 'inactive'}`}
                    >
                      {FABRIC_CATALOG_STATUS_LABELS[catalog.status]}
                    </span>
                  </div>
                  <div className="mobile-card-body">
                    <p className="font-bold text-sm mb-1">{catalog.name}</p>
                    <p className="text-xs text-muted italic mb-2">
                      {catalog.composition || 'Chưa định nghĩa thành phần'}
                    </p>
                    <div className="flex justify-between items-center text-xs text-muted border-t border-border/10 pt-2">
                      <span>Đơn vị: {catalog.unit}</span>
                      <Icon name="ChevronRight" size={16} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Pagination result={data} onPageChange={setPage} />
    </div>
  );
}
