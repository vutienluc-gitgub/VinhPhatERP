import { useState } from 'react';

import { useFabricCatalogList } from '@/application/settings';
import {
  Icon,
  Badge,
  DataTablePremium,
  ClearFilterButton,
} from '@/shared/components';
import { Pagination } from '@/shared/components/Pagination';

export function PortalFabricCatalogPage() {
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({
    search: undefined as string | undefined,
    status: 'active' as const,
  });
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useFabricCatalogList(
    {
      search: filters.search,
      status: 'active',
    },
    page,
  );

  const catalogs = data?.data ?? [];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      search: searchInput.trim() || undefined,
    }));
  }

  return (
    <div className="portal-page">
      <div className="portal-page-header">
        <div className="portal-header-info">
          <h2 className="portal-title">Danh mục sản phẩm</h2>
          <p className="portal-subtitle">
            Khám phá các loại vải và mã hàng Vĩnh Phát đang cung cấp
          </p>
        </div>
      </div>

      <div className="portal-card">
        {/* Search Bar */}
        <div className="p-4 border-b border-border bg-surface-subtle">
          <div className="flex flex-wrap items-center gap-4">
            <form
              className="search-input-wrapper flex-1 min-w-[280px]"
              onSubmit={handleSearch}
            >
              <input
                className="field-input"
                type="text"
                placeholder="Tìm sản phẩm, thành phần..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onBlur={handleSearch}
              />
              <Icon name="Search" size={16} className="search-input-icon" />
            </form>
            {filters.search && (
              <ClearFilterButton
                onClick={() => {
                  setSearchInput('');
                  setFilters({
                    ...filters,
                    search: undefined,
                  });
                }}
              />
            )}
          </div>
        </div>

        {error && (
          <p className="p-4 text-danger">
            Lỗi tải danh mục: {(error as Error).message}
          </p>
        )}

        <DataTablePremium
          data={catalogs}
          isLoading={isLoading}
          rowKey={(c) => c.id}
          emptyStateTitle="Không tìm thấy loại vải nào"
          emptyStateDescription="Vui lòng thử tìm kiếm với các từ khóa khác."
          emptyStateIcon="Layers"
          columns={[
            {
              header: 'Mã vải',
              cell: (c) => (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                    <Icon name="Layers" size={20} />
                  </div>
                  <span className="font-bold text-primary">{c.code}</span>
                </div>
              ),
            },
            {
              header: 'Tên loại vải',
              cell: (c) => (
                <div className="flex flex-col">
                  <span className="font-bold text-base">{c.name}</span>
                  <span className="text-xs text-muted italic line-clamp-1">
                    {c.composition || 'Đang cập nhật thành phần...'}
                  </span>
                </div>
              ),
            },
            {
              header: 'Quy cách (chuẩn)',
              cell: (c) => (
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm">
                    Khổ:{' '}
                    <span className="font-medium">
                      {c.target_width_cm ? `${c.target_width_cm} cm` : '—'}
                    </span>
                  </span>
                  <span className="text-sm">
                    K/L:{' '}
                    <span className="font-medium">
                      {c.target_gsm ? `${c.target_gsm} gsm` : '—'}
                    </span>
                  </span>
                </div>
              ),
            },
            {
              header: 'Đơn vị',
              cell: (c) => <Badge variant="gray">{c.unit}</Badge>,
            },
            {
              header: 'Đặc tính',
              cell: (c) => (
                <div className="flex gap-1 flex-wrap">
                  {c.composition && (
                    <span className="px-2 py-0.5 rounded-md bg-surface text-[0.65rem] font-bold border border-border shadow-sm">
                      {c.composition.split('/')[0]}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-md bg-surface text-[0.65rem] font-bold border border-border shadow-sm uppercase">
                    Premium
                  </span>
                </div>
              ),
            },
          ]}
          renderMobileCard={(c) => (
            <div className="portal-mobile-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Icon name="Layers" size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-primary leading-tight">
                    {c.code}
                  </h4>
                  <p className="text-xs text-muted">{c.unit}</p>
                </div>
              </div>
              <h3 className="font-bold text-base mb-1">{c.name}</h3>
              <p className="text-sm text-muted italic mb-2">
                {c.composition || 'Chưa rõ thành phần'}
              </p>
              <div className="grid grid-cols-2 gap-2 mb-3 bg-surface border border-border rounded-lg p-2">
                <div>
                  <span className="block text-[10px] text-muted font-bold uppercase tracking-wider">
                    Khổ chuẩn
                  </span>
                  <span className="text-sm font-medium">
                    {c.target_width_cm ? `${c.target_width_cm} cm` : '—'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-muted font-bold uppercase tracking-wider">
                    K/L chuẩn
                  </span>
                  <span className="text-sm font-medium">
                    {c.target_gsm ? `${c.target_gsm} gsm` : '—'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-1 rounded-md bg-surface-subtle text-[10px] font-bold border border-border">
                  {c.composition?.split('/')[0] || 'Fabric'}
                </span>
                <span className="px-2 py-1 rounded-md bg-primary/5 text-primary text-[10px] font-bold border border-primary/10 uppercase">
                  Có sẵn
                </span>
              </div>
            </div>
          )}
        />

        <div className="p-4 md:p-6 border-t border-border">
          <Pagination result={data} onPageChange={setPage} />
        </div>
      </div>

      <div className="mt-6 p-5 bg-primary/5 rounded-2xl border border-primary/10 flex flex-col md:flex-row items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-primary shadow-sm flex-shrink-0">
          <Icon name="Info" size={24} />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-primary-strong mb-1">
            Yêu cầu báo giá đặc biệt?
          </h4>
          <p className="text-sm text-muted leading-relaxed">
            Nếu bạn không tìm thấy mã vải mong muốn hoặc cần đặt sản xuất theo
            yêu cầu, vui lòng liên hệ trực tiếp với nhân viên kinh doanh của
            Vĩnh Phát để được hỗ trợ.
          </p>
        </div>
        <button className="btn-primary" type="button">
          Liên hệ ngay
        </button>
      </div>
    </div>
  );
}
