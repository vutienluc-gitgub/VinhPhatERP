import { useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';

import { usePortalQuotations } from '@/application/crm/portal';
import { MoneyText } from '@/shared/value';
import { Icon, EmptyState, FilterChips } from '@/shared/components';
import { QUOTATION_STATUS_LABELS } from '@/features/customer-portal/constants';

const STATUS_BADGE: Record<string, string> = {
  sent: 'portal-badge portal-badge--in-progress',
  confirmed: 'portal-badge portal-badge--completed',
  rejected: 'portal-badge portal-badge--cancelled',
  expired: 'portal-badge portal-badge--draft',
  converted: 'portal-badge portal-badge--confirmed',
};

type FilterStatus = 'ALL' | 'SENT' | 'CONFIRMED' | 'EXPIRED' | 'REJECTED';

export function PortalQuotationsPage() {
  const { quotations, loading, error, page, setPage, PAGE_SIZE } =
    usePortalQuotations();
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('ALL');

  if (loading)
    return (
      <div className="portal-loading">
        <Icon
          name="Loader2"
          size={24}
          className="animate-spin text-foreground"
        />
        Đang tải báo giá…
      </div>
    );

  if (error) return <div className="portal-error">{error}</div>;

  const filteredQuotations = quotations.filter((q) => {
    const isExpired = q.valid_until && dayjs().isAfter(dayjs(q.valid_until));
    const displayStatus =
      isExpired && q.status === 'sent' ? 'expired' : q.status;

    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'SENT') return displayStatus === 'sent';
    if (activeFilter === 'CONFIRMED')
      return displayStatus === 'confirmed' || displayStatus === 'converted';
    if (activeFilter === 'EXPIRED') return displayStatus === 'expired';
    if (activeFilter === 'REJECTED') return displayStatus === 'rejected';
    return true;
  });

  const filterOptions: Array<{ id: FilterStatus; label: string }> = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'SENT', label: QUOTATION_STATUS_LABELS.sent },
    { id: 'CONFIRMED', label: QUOTATION_STATUS_LABELS.confirmed },
    { id: 'EXPIRED', label: QUOTATION_STATUS_LABELS.expired },
    { id: 'REJECTED', label: QUOTATION_STATUS_LABELS.rejected },
  ];

  return (
    <div className="portal-section">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="portal-page-title mb-1">Báo giá</h1>
          <p className="text-sm text-muted-foreground">
            Danh sách các báo giá Vĩnh Phát gửi tới bạn.
          </p>
        </div>
      </div>

      <FilterChips
        options={filterOptions}
        activeValue={activeFilter}
        onChange={(val) => setActiveFilter(val as FilterStatus)}
      />

      {filteredQuotations.length === 0 ? (
        <div className="portal-table-wrap">
          <div className="p-8">
            <EmptyState
              icon="FileText"
              description="Hiện chưa có báo giá nào phù hợp."
            />
          </div>
        </div>
      ) : (
        <div className="portal-table-wrap">
          {/* Desktop view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Số báo giá</th>
                  <th>Ngày gửi</th>
                  <th>Hạn mức đến</th>
                  <th className="right">Tổng giá trị</th>
                  <th>Trạng thái</th>
                  <th className="right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotations.map((q) => {
                  const isExpired =
                    q.valid_until && dayjs().isAfter(dayjs(q.valid_until));
                  const displayStatus =
                    isExpired && q.status === 'sent' ? 'expired' : q.status;

                  return (
                    <tr key={q.id}>
                      <td>
                        <Link
                          to={`/portal/quotations/${q.id}`}
                          className="font-semibold text-foreground hover:underline"
                        >
                          {q.quotation_number}
                        </Link>
                      </td>
                      <td className="text-muted-foreground text-sm">
                        {dayjs(q.quotation_date).format('DD/MM/YYYY')}
                      </td>
                      <td className="text-muted-foreground text-sm">
                        {q.valid_until ? (
                          <span className={isExpired ? 'text-danger' : ''}>
                            {dayjs(q.valid_until).format('DD/MM/YYYY')}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="right font-bold text-foreground">
                        <MoneyText value={q.total_amount} suffix=" đ" />
                      </td>
                      <td>
                        <span
                          className={
                            STATUS_BADGE[displayStatus] ?? 'portal-badge'
                          }
                        >
                          {QUOTATION_STATUS_LABELS[displayStatus] ??
                            displayStatus}
                        </span>
                      </td>
                      <td className="right">
                        <Link
                          to={`/portal/quotations/${q.id}`}
                          className="portal-btn-icon"
                        >
                          <Icon name="ChevronRight" size={20} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile view */}
          <div className="md:hidden space-y-4 p-3">
            {filteredQuotations.map((q) => {
              const isExpired =
                q.valid_until && dayjs().isAfter(dayjs(q.valid_until));
              const displayStatus =
                isExpired && q.status === 'sent' ? 'expired' : q.status;

              return (
                <Link
                  key={q.id}
                  to={`/portal/quotations/${q.id}`}
                  className="block portal-order-card hover:bg-slate-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-foreground">
                      {q.quotation_number}
                    </span>
                    <span
                      className={STATUS_BADGE[displayStatus] ?? 'portal-badge'}
                    >
                      {QUOTATION_STATUS_LABELS[displayStatus] ?? displayStatus}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <div>
                        Gửi: {dayjs(q.quotation_date).format('DD/MM/YYYY')}
                      </div>
                      {q.valid_until && (
                        <div
                          className={isExpired ? 'text-danger font-medium' : ''}
                        >
                          Hạn: {dayjs(q.valid_until).format('DD/MM/YYYY')}
                        </div>
                      )}
                    </div>
                    <div className="font-bold text-foreground">
                      <MoneyText value={q.total_amount} suffix=" đ" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="portal-pagination">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              &laquo; Trước
            </button>
            <span>Trang {page + 1}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={quotations.length < PAGE_SIZE}
            >
              Tiếp &raquo;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
