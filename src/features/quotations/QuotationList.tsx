import { useState } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import { Pagination } from '@/shared/components/Pagination';
import {
  Icon,
  Badge,
  type BadgeVariant,
  DataTablePremium,
} from '@/shared/components';
import { Combobox } from '@/shared/components/Combobox';
import { formatCurrency } from '@/shared/utils/format';

import { QUOTATION_STATUS_LABELS } from './quotations.module';
import type { Quotation, QuotationsFilter, QuotationStatus } from './types';
import {
  useDeleteQuotation,
  useExpiringQuotationsCount,
  useQuotationList,
} from './useQuotations';

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
          <p className="eyebrow-premium">BÁN HÀNG</p>
          <h3 className="title-premium">Báo giá</h3>
        </div>
        <button
          className="btn-primary"
          type="button"
          onClick={onNew}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            minHeight: 42,
            padding: '0 1.25rem',
          }}
        >
          <Icon name="Plus" size={18} /> Tạo báo giá
        </button>
      </div>

      {/* Expiration KPI */}
      {expiringData &&
        (expiringData.expiring > 0 || expiringData.expired > 0) && (
          <div
            className="kpi-grid"
            style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border)',
            }}
          >
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
                <div
                  className="kpi-footer"
                  style={{
                    fontSize: '0.75rem',
                    opacity: 0.8,
                    fontStyle: 'italic',
                  }}
                >
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
                <div
                  className="kpi-footer"
                  style={{
                    fontSize: '0.75rem',
                    opacity: 0.8,
                    fontStyle: 'italic',
                  }}
                >
                  Không còn hiệu lực (Đã qua hạn chót)
                </div>
              </div>
            )}
          </div>
        )}

      {/* Filters */}
      <div
        className="filter-bar card-filter-section"
        style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--border)',
        }}
      >
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
            <button
              className="btn-secondary"
              type="button"
              onClick={() => {
                setFilters({});
                setSearchInput('');
              }}
              style={{
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                color: 'var(--danger)',
              }}
            >
              <Icon name="X" size={14} /> Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '1rem' }}>
          <p className="error-inline">
            Lỗi tải dữ liệu: {(error as Error).message}
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
        emptyStateIcon={hasFilter ? '🔍' : 'ClipboardList'}
        emptyStateActionLabel={!hasFilter ? '+ Tạo báo giá' : undefined}
        onEmptyStateAction={!hasFilter ? onNew : undefined}
        columns={[
          {
            header: 'Số báo giá / Bắt đầu',
            cell: (q) => (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.15rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      color: 'var(--primary)',
                    }}
                  >
                    {q.quotation_number}
                  </span>
                  {q.revision > 1 && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--muted)',
                      }}
                    >
                      v{q.revision}
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--muted)',
                  }}
                >
                  {q.quotation_date}
                </span>
              </div>
            ),
          },
          {
            header: 'Khách hàng',
            cell: (q) => (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.15rem',
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 200,
                  }}
                >
                  {q.customers?.name ?? '—'}
                </span>
                {q.customers?.code && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--muted)',
                    }}
                  >
                    {q.customers.code}
                  </span>
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
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.15rem',
                  }}
                >
                  <span>{q.valid_until ?? '—'}</span>
                  {validity && isActiveQuote && (
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: validity.urgent ? 600 : 400,
                        color: validity.urgent
                          ? 'var(--danger)'
                          : 'var(--muted)',
                      }}
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
              <span style={{ fontWeight: 700 }}>
                {formatCurrency(q.total_amount)}
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
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.25rem',
                }}
              >
                <button
                  className="btn-icon"
                  type="button"
                  title="Xem"
                  onClick={() => onView(q)}
                >
                  <Icon name="Eye" size={16} />
                </button>
                {q.status === 'draft' && (
                  <>
                    <button
                      className="btn-icon"
                      type="button"
                      title="Sửa"
                      onClick={() => onEdit(q)}
                    >
                      <Icon name="Pencil" size={16} />
                    </button>
                    <button
                      className="btn-icon"
                      type="button"
                      title="Xóa"
                      onClick={() => handleDelete(q)}
                      disabled={deleteMutation.isPending}
                      style={{ color: 'var(--danger)' }}
                    >
                      <Icon name="Trash2" size={16} />
                    </button>
                  </>
                )}
              </div>
            ),
          },
        ]}
        renderMobileCard={(q) => {
          const validity = validityInfo(q.valid_until);
          const isActiveQuote = q.status === 'draft' || q.status === 'sent';

          return (
            <div className="mobile-card">
              <div className="mobile-card-header">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <span className="mobile-card-title">
                    {q.quotation_number}
                  </span>
                  {q.revision > 1 && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--muted)',
                      }}
                    >
                      v{q.revision}
                    </span>
                  )}
                </div>
                <Badge variant={getStatusVariant(q.status)}>
                  {QUOTATION_STATUS_LABELS[q.status]}
                </Badge>
              </div>

              <div className="mobile-card-body">
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    marginBottom: '0.75rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--muted)',
                    }}
                  >
                    Khách hàng
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: '1rem',
                      lineHeight: 1.3,
                    }}
                  >
                    {q.customers?.name ?? '—'}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--muted)',
                      }}
                    >
                      Tổng tiền
                    </span>
                    <span
                      style={{
                        fontWeight: 700,
                        color: 'var(--primary)',
                      }}
                    >
                      {formatCurrency(q.total_amount)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--muted)',
                      }}
                    >
                      Thời hạn
                    </span>
                    <span style={{ fontWeight: 500 }}>
                      {q.valid_until ?? '—'}
                    </span>
                    {validity && isActiveQuote && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: validity.urgent ? 600 : 400,
                          color: validity.urgent
                            ? 'var(--danger)'
                            : 'var(--muted)',
                        }}
                      >
                        {validity.text}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  <button
                    className="btn-secondary"
                    style={{ flex: 1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(q);
                    }}
                  >
                    <Icon name="Eye" size={16} /> Chi tiết
                  </button>
                  {q.status === 'draft' && (
                    <>
                      <button
                        className="btn-secondary"
                        style={{
                          flex: 1,
                          color: 'var(--primary)',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(q);
                        }}
                      >
                        <Icon name="Pencil" size={16} /> Sửa
                      </button>
                      <button
                        className="btn-secondary"
                        style={{
                          color: 'var(--danger)',
                          padding: '0 0.75rem',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(q);
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Icon name="Trash2" size={16} />
                      </button>
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
