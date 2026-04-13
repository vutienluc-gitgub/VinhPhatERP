import { useState } from 'react';

import {
  Icon,
  DataTablePremium,
  AddButton,
  ClearFilterButton,
  ActionBar,
} from '@/shared/components';
import { Combobox } from '@/shared/components/Combobox';
import { useContractsList } from '@/application/contracts';

import {
  CONTRACT_STATUSES,
  CONTRACT_STATUS_LABELS,
  CONTRACT_TYPES,
  CONTRACT_TYPE_LABELS,
} from './contracts.module';
import type {
  Contract,
  ContractsFilter,
  ContractStatus,
  ContractType,
} from './contracts.module';
import { ContractStatusBadge } from './ContractStatusBadge';

type ContractsPageProps = {
  onView?: (contract: Contract) => void;
  onNew?: () => void;
};

export function ContractsPage({ onView, onNew }: ContractsPageProps) {
  const [filters, setFilters] = useState<ContractsFilter>({});
  const [searchInput, setSearchInput] = useState('');

  const { data: contracts = [], isLoading, error } = useContractsList(filters);

  const hasFilter = !!(
    filters.search ||
    filters.status ||
    filters.type ||
    filters.dateFrom ||
    filters.dateTo
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setFilters((prev) => ({
      ...prev,
      search: searchInput.trim() || undefined,
    }));
  }

  function clearFilters() {
    setFilters({});
    setSearchInput('');
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">QUẢN LÝ HỢP ĐỒNG</p>
          <h3 className="title-premium">Danh sách hợp đồng</h3>
        </div>
        <AddButton
          onClick={onNew ?? (() => {})}
          label="Tạo hợp đồng mới"
          icon="FilePlus"
        />
      </div>

      {/* KPI */}
      <div className="kpi-grid p-4 md:p-6 bg-surface-subtle border-b border-border">
        <div className="kpi-card-premium kpi-primary">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Tổng hợp đồng</p>
              <p className="kpi-value">{contracts.length}</p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="FileText" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Tất cả hợp đồng trong hệ thống
          </div>
        </div>

        <div className="kpi-card-premium kpi-success">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Đã ký</p>
              <p className="kpi-value">
                {contracts.filter((c) => c.status === 'signed').length}
              </p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="CheckCircle" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Hợp đồng đã được ký kết
          </div>
        </div>

        <div className="kpi-card-premium kpi-warning">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Chờ xử lý</p>
              <p className="kpi-value">
                {
                  contracts.filter(
                    (c) => c.status === 'draft' || c.status === 'sent',
                  ).length
                }
              </p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Clock" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Nháp / Đã gửi
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="filter-bar card-filter-section p-4 border-b border-border">
        <div className="filter-compact-premium">
          <div className="filter-field">
            <label htmlFor="contract-search">Tìm kiếm</label>
            <form className="search-input-wrapper" onSubmit={handleSearch}>
              <input
                id="contract-search"
                className="field-input"
                type="text"
                placeholder="Số hợp đồng, tên đối tác..."
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
                ...CONTRACT_STATUSES.map((s: ContractStatus) => ({
                  value: s,
                  label: CONTRACT_STATUS_LABELS[s],
                })),
              ]}
              value={filters.status ?? ''}
              onChange={(val) => {
                setFilters((prev) => ({
                  ...prev,
                  status: (val as ContractStatus) || undefined,
                }));
              }}
            />
          </div>

          <div className="filter-field">
            <label>Loại hợp đồng</label>
            <Combobox
              options={[
                {
                  value: '',
                  label: 'Tất cả loại',
                },
                ...CONTRACT_TYPES.map((t: ContractType) => ({
                  value: t,
                  label: CONTRACT_TYPE_LABELS[t],
                })),
              ]}
              value={filters.type ?? ''}
              onChange={(val) => {
                setFilters((prev) => ({
                  ...prev,
                  type: (val as ContractType) || undefined,
                }));
              }}
            />
          </div>

          <div className="filter-field">
            <label>Từ ngày</label>
            <input
              className="field-input"
              type="date"
              value={filters.dateFrom ?? ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  dateFrom: e.target.value || undefined,
                }))
              }
            />
          </div>

          <div className="filter-field">
            <label>Đến ngày</label>
            <input
              className="field-input"
              type="date"
              value={filters.dateTo ?? ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  dateTo: e.target.value || undefined,
                }))
              }
            />
          </div>

          {hasFilter && <ClearFilterButton onClick={clearFilters} />}
        </div>
      </div>

      {error && (
        <div className="p-4">
          <p className="error-inline">Lỗi: {(error as Error).message}</p>
        </div>
      )}

      {/* Table */}
      <DataTablePremium
        data={contracts}
        isLoading={isLoading}
        rowKey={(c) => c.id}
        onRowClick={onView}
        emptyStateTitle={
          hasFilter ? 'Không tìm thấy hợp đồng' : 'Chưa có hợp đồng nào'
        }
        emptyStateDescription={
          hasFilter
            ? 'Vui lòng thử điều chỉnh lại bộ lọc.'
            : 'Nhấn nút tạo hợp đồng mới để bắt đầu.'
        }
        emptyStateIcon={hasFilter ? 'Search' : 'FileText'}
        emptyStateActionLabel={!hasFilter ? '+ Tạo hợp đồng mới' : undefined}
        onEmptyStateAction={!hasFilter ? onNew : undefined}
        columns={[
          {
            header: 'Số hợp đồng',
            cell: (c) => (
              <span className="font-bold text-primary font-mono text-sm">
                {c.contract_number}
              </span>
            ),
          },
          {
            header: 'Loại',
            cell: (c) => (
              <span className="badge-outline text-xs">
                {CONTRACT_TYPE_LABELS[c.type]}
              </span>
            ),
          },
          {
            header: 'Bên A (Đối tác)',
            cell: (c) => (
              <div className="flex flex-col">
                <span className="font-medium">{c.party_a_name}</span>
                {c.party_a_tax_code && (
                  <span className="text-xs text-muted">
                    MST: {c.party_a_tax_code}
                  </span>
                )}
              </div>
            ),
          },
          {
            header: 'Trạng thái',
            cell: (c) => <ContractStatusBadge status={c.status} />,
          },
          {
            header: 'Ngày tạo',
            className: 'td-muted text-sm',
            cell: (c) => formatDate(c.created_at),
          },
          {
            header: 'Thao tác',
            className: 'text-right',
            onCellClick: () => {},
            cell: (c) => (
              <ActionBar
                actions={[
                  {
                    icon: 'Eye',
                    onClick: () => onView?.(c),
                    title: 'Xem chi tiết',
                  },
                ]}
              />
            ),
          },
        ]}
        renderMobileCard={(c) => (
          <div className="mobile-card">
            <div className="mobile-card-header">
              <span className="mobile-card-title font-mono text-sm">
                {c.contract_number}
              </span>
              <ContractStatusBadge status={c.status} />
            </div>
            <div className="mobile-card-body space-y-2">
              <p className="font-bold text-base">{c.party_a_name}</p>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted">
                  <Icon name="FileText" size={14} />
                  <span>{CONTRACT_TYPE_LABELS[c.type]}</span>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <Icon name="Calendar" size={14} />
                  <span>{formatDate(c.created_at)}</span>
                </div>
              </div>

              {c.party_a_tax_code && (
                <p className="text-xs text-muted">MST: {c.party_a_tax_code}</p>
              )}

              <div className="flex justify-end items-center pt-2 mt-2 border-t border-border/10">
                <Icon name="ChevronRight" size={16} className="text-muted" />
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
}
