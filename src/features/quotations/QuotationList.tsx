import { useState } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import { Pagination } from '@/shared/components/Pagination';
import {
  Icon,
  Badge,
  type BadgeVariant,
  DataTablePremium,
  AddButton,
  Button,
  ClearFilterButton,
  ActionBar,
} from '@/shared/components';
import type { ActionConfig } from '@/shared/components';
import { Combobox } from '@/shared/components/Combobox';
import { formatCurrency } from '@/shared/utils/format';
import {
  useDeleteQuotation,
  useExpiringQuotationsCount,
  useQuotationList,
} from '@/application/quotations';

import { QUOTATION_STATUS_LABELS } from './quotations.module';
import type { Quotation, QuotationsFilter, QuotationStatus } from './types';

type QuotationListProps = {
  onEdit: (quotation: Quotation) => void;
  onNew: () => void;
  onView: (quotation: Quotation) => void;
};

function getStatusVariant(status: QuotationStatus): BadgeVariant {
  switch (status) {
    case 'draft':
      return 'gray';
    case 'sent':
      return 'info';
    case 'confirmed':
      return 'success';
    case 'rejected':
      return 'danger';
    case 'expired':
      return 'gray';
    case 'converted':
      return 'purple';
    default:
      return 'gray';
  }
}

function validityInfo(
  validUntil: string | null,
): { text: string; urgent: boolean } | null {
  if (!validUntil) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(validUntil);
  const diff = Math.ceil(
    (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff < 0)
    return {
      text: `Hết hạn ${Math.abs(diff)} ngày`,
      urgent: true,
    };
  if (diff === 0)
    return {
      text: 'Hết hạn hôm nay',
      urgent: true,
    };
  if (diff <= 3)
    return {
      text: `Còn ${diff} ngày`,
      urgent: true,
    };
  return {
    text: `Còn ${diff} ngày`,
    urgent: false,
  };
}

export function QuotationList({ onEdit, onNew, onView }: QuotationListProps) {
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<QuotationsFilter>({});
  const [page, setPage] = useState(1);

  const { data: result, isLoading, error } = useQuotationList(filters, page);
  const quotations = result?.data ?? [];
  const deleteMutation = useDeleteQuotation();
  const { data: expiringData } = useExpiringQuotationsCount();
  const { confirm, alert: showAlert } = useConfirm();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      search: searchInput.trim() || undefined,
    }));
  }

  async function handleDelete(q: Quotation) {
    if (q.status !== 'draft') {
      await showAlert('Chỉ có thể xoá báo giá ở trạng thái Nháp.');
      return;
    }
    const ok = await confirm({
      message: `Xóa báo giá "${q.quotation_number}"? Hành động này không thể hoàn tác.`,
      variant: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(q.id);
  }

  const hasFilter = !!(filters.search || filters.status);

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">KINH DOANH</p>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Quản lý Báo giá
          </h2>
        </div>
        <AddButton onClick={onNew} label="Tạo báo giá" />
      </div>

      {/* Expiration KPI */}
      {expiringData &&
        (expiringData.expiring > 0 || expiringData.expired > 0) && (
          <div className="kpi-grid p-4 border-b border-border">
            {expiringData.expiring > 0 && (
              <div className="kpi-card-premium kpi-warning">
                <div className="kpi-overlay" />
                <div className="kpi-content">
                  <div className="kpi-info">
                    <p className="kpi-label">Sắp hết hạn</p>
                    <p className="kpi-value">{expiringData.expiring}</p>
                  </div>
                  <div className="kpi-icon-box">
                    <Icon name="Clock" size={32} />
                  </div>
                </div>
                <div className="kpi-footer opacity-80 text-xs italic">
                  Cần theo dõi sát với khách hàng
                </div>
              </div>
            )}
            {expiringData.expired > 0 && (
              <div className="kpi-card-premium kpi-danger">
                <div className="kpi-overlay" />
                <div className="kpi-content">
                  <div className="kpi-info">
                    <p className="kpi-label">Đã hết hạn</p>
                    <p className="kpi-value">{expiringData.expired}</p>
                  </div>
                  <div className="kpi-icon-box">
                    <Icon name="AlertCircle" size={32} />
                  </div>
                </div>
                <div className="kpi-footer opacity-80 text-xs italic">
                  Không còn hiệu lực (Đã quá hạn chót)
                </div>
              </div>
            )}
          </div>
        )}

      {/* Filters */}
      <div className="filter-bar card-filter-section p-4 border-b border-border">
        <div className="filter-compact-premium">
          <div className="filter-field">
            <label htmlFor="filter-quote-search">Tìm kiếm</label>
            <form className="search-input-wrapper" onSubmit={handleSearch}>
              <input
                id="filter-quote-search"
                className="field-input"
                type="text"
                placeholder="Số báo giá..."
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
                  value: 'draft',
                  label: 'Nháp',
                },
                {
                  value: 'sent',
                  label: 'Đã gửi',
                },
                {
                  value: 'confirmed',
                  label: 'Đã duyệt',
                },
                {
                  value: 'rejected',
                  label: 'Từ chối',
                },
                {
                  value: 'expired',
                  label: 'Hết hạn',
                },
                {
                  value: 'converted',
                  label: 'Đã chuyển ĐH',
                },
              ]}
              value={filters.status ?? ''}
              onChange={(val) => {
                setPage(1);
                setFilters((prev) => ({
                  ...prev,
                  status: (val as QuotationStatus) || undefined,
                }));
              }}
            />
          </div>

          {hasFilter && (
            <ClearFilterButton
              onClick={() => {
                setFilters({});
                setSearchInput('');
              }}
            />
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4">
          <p className="error-inline">
            Loi tai du lieu: {(error as Error).message}
          </p>
        </div>
      )}

      {/* Table & Cards */}
      <DataTablePremium
        data={quotations}
        isLoading={isLoading}
        rowKey={(q) => q.id}
        onRowClick={(q) => onView(q)}
        emptyStateTitle={
          hasFilter ? 'Không tìm thấy báo giá' : 'Chưa có báo giá nào'
        }
        emptyStateDescription={
          hasFilter
            ? 'Hãy thử thay đổi điều kiện lọc.'
            : 'Nhấn nút tạo báo giá để giới thiệu sản phẩm cho khách hàng.'
        }
        emptyStateIcon={hasFilter ? 'Search' : 'ClipboardList'}
        emptyStateActionLabel={!hasFilter ? '+ Tạo báo giá' : undefined}
        onEmptyStateAction={!hasFilter ? onNew : undefined}
        columns={[
          {
            header: 'Số báo giá / Ngày tạo',
            cell: (q) => (
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-primary">
                    {q.quotation_number}
                  </span>
                  {q.revision > 1 && (
                    <span className="text-xs text-muted">v{q.revision}</span>
                  )}
                </div>
                <span className="text-xs text-muted">{q.quotation_date}</span>
              </div>
            ),
          },
          {
            header: 'Khách hàng',
            cell: (q) => (
              <div className="flex flex-col gap-0.5">
                <span className="font-bold truncate max-w-[200px]">
                  {q.customers?.name ?? '—'}
                </span>
                {q.customers?.code && (
                  <span className="text-xs text-muted">{q.customers.code}</span>
                )}
              </div>
            ),
          },
          {
            header: 'Hiệu lực',
            cell: (q) => {
              const validity = validityInfo(q.valid_until);
              const isActiveQuote = q.status === 'draft' || q.status === 'sent';
              return (
                <div className="flex flex-col gap-0.5">
                  <span>{q.valid_until ?? '—'}</span>
                  {validity && isActiveQuote && (
                    <span
                      className={`text-[0.78rem] ${validity.urgent ? 'font-bold text-danger' : 'text-muted'}`}
                    >
                      {validity.text}
                    </span>
                  )}
                </div>
              );
            },
          },
          {
            header: 'Tổng tiền',
            className: 'text-right',
            cell: (q) => (
              <span className="font-bold">
                {formatCurrency(q.total_amount)}đ
              </span>
            ),
          },
          {
            header: 'Trạng thái',
            cell: (q) => (
              <Badge variant={getStatusVariant(q.status)}>
                {QUOTATION_STATUS_LABELS[q.status]}
              </Badge>
            ),
          },
          {
            header: 'Thao tác',
            className: 'text-right',
            onCellClick: () => {},
            cell: (q) => (
              <ActionBar
                actions={
                  [
                    {
                      icon: 'Eye',
                      onClick: () => onView(q),
                      title: 'Xem',
                    },
                    q.status === 'draft'
                      ? {
                          icon: 'Pencil',
                          onClick: () => onEdit(q),
                          title: 'Sửa',
                        }
                      : null,
                    q.status === 'draft'
                      ? {
                          icon: 'Trash2',
                          onClick: () => handleDelete(q),
                          title: 'Xóa',
                          variant: 'danger',
                          disabled: deleteMutation.isPending,
                        }
                      : null,
                  ].filter(Boolean) as ActionConfig[]
                }
              />
            ),
          },
        ]}
        renderMobileCard={(q) => {
          const validity = validityInfo(q.valid_until);
          const isActiveQuote = q.status === 'draft' || q.status === 'sent';

          return (
            <div className="mobile-card">
              <div className="mobile-card-header">
                <div className="flex items-center gap-1.5">
                  <span className="mobile-card-title">
                    {q.quotation_number}
                  </span>
                  {q.revision > 1 && (
                    <span className="text-xs text-muted">v{q.revision}</span>
                  )}
                </div>
                <Badge variant={getStatusVariant(q.status)}>
                  {QUOTATION_STATUS_LABELS[q.status]}
                </Badge>
              </div>

              <div className="mobile-card-body">
                <div className="flex flex-col mb-3">
                  <span className="text-[0.72rem] text-muted uppercase tracking-wider">
                    Khách hàng
                  </span>
                  <span className="font-bold text-base leading-tight">
                    {q.customers?.name ?? '—'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="flex flex-col">
                    <span className="text-[0.72rem] text-muted uppercase tracking-wider">
                      Tổng tiền
                    </span>
                    <span className="font-bold text-lg text-primary">
                      {formatCurrency(q.total_amount)}đ
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[0.72rem] text-muted uppercase tracking-wider">
                      Thời hạn
                    </span>
                    <span className="font-medium">{q.valid_until ?? '—'}</span>
                    {validity && isActiveQuote && (
                      <span
                        className={`text-[0.7rem] ${validity.urgent ? 'font-bold text-danger' : 'text-muted'}`}
                      >
                        {validity.text}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-border">
                  <Button
                    variant="secondary"
                    className="flex-1 shadow-sm font-medium"
                    leftIcon="Eye"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(q);
                    }}
                  >
                    Chi tiết
                  </Button>
                  {q.status === 'draft' && (
                    <>
                      <Button
                        variant="secondary"
                        className="flex-1 text-primary shadow-sm font-medium"
                        leftIcon="Pencil"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(q);
                        }}
                      >
                        Sửa
                      </Button>
                      <Button
                        variant="secondary"
                        className="text-danger px-3 shadow-sm"
                        leftIcon="Trash2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(q);
                        }}
                        disabled={deleteMutation.isPending}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        }}
      />

      <Pagination result={result} onPageChange={setPage} />
    </div>
  );
}
