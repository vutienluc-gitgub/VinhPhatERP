import { Link } from 'react-router-dom';
import dayjs from 'dayjs';

import { usePortalQuotations } from '@/features/customer-portal/hooks/usePortalQuotations';
import { formatCurrency } from '@/shared/utils/format';
import { Icon } from '@/shared/components';

const STATUS_LABEL: Record<string, string> = {
  sent: 'Mới',
  confirmed: 'Đã chấp nhận',
  rejected: 'Từ chối',
  expired: 'Hết hạn',
  converted: 'Đã lên đơn',
};

const STATUS_BADGE: Record<string, string> = {
  sent: 'portal-badge portal-badge--in-progress',
  confirmed: 'portal-badge portal-badge--completed',
  rejected: 'portal-badge portal-badge--cancelled',
  expired: 'portal-badge portal-badge--draft',
  converted: 'portal-badge portal-badge--confirmed',
};

export function PortalQuotationsPage() {
  const { quotations, loading, error, page, setPage, PAGE_SIZE } =
    usePortalQuotations();

  if (loading)
    return (
      <div className="portal-loading">
        <Icon name="Loader2" size={24} className="animate-spin text-primary" />
        Đang tải báo giá…
      </div>
    );

  if (error) return <div className="portal-error">{error}</div>;

  return (
    <div className="portal-section">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="portal-page-title mb-1">Báo giá</h1>
          <p className="text-sm text-gray-500">
            Danh sách các báo giá Vĩnh Phát gửi tới bạn.
          </p>
        </div>
      </div>

      {quotations.length === 0 ? (
        <div className="portal-table-wrap">
          <div className="portal-empty">
            <div className="portal-empty-icon">
              <Icon name="FileText" size={48} strokeWidth={1.5} />
            </div>
            <p>Hiện chưa có báo giá nào dành cho bạn.</p>
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
                {quotations.map((q) => {
                  const isExpired =
                    q.valid_until && dayjs().isAfter(dayjs(q.valid_until));
                  const displayStatus =
                    isExpired && q.status === 'sent' ? 'expired' : q.status;

                  return (
                    <tr key={q.id}>
                      <td>
                        <Link
                          to={`/portal/quotations/${q.id}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {q.quotation_number}
                        </Link>
                      </td>
                      <td className="text-gray-500 text-sm">
                        {dayjs(q.quotation_date).format('DD/MM/YYYY')}
                      </td>
                      <td className="text-gray-500 text-sm">
                        {q.valid_until ? (
                          <span className={isExpired ? 'text-red-500' : ''}>
                            {dayjs(q.valid_until).format('DD/MM/YYYY')}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="right font-bold text-gray-800">
                        {formatCurrency(q.total_amount)} đ
                      </td>
                      <td>
                        <span
                          className={
                            STATUS_BADGE[displayStatus] ?? 'portal-badge'
                          }
                        >
                          {STATUS_LABEL[displayStatus] ?? displayStatus}
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
            {quotations.map((q) => {
              const isExpired =
                q.valid_until && dayjs().isAfter(dayjs(q.valid_until));
              const displayStatus =
                isExpired && q.status === 'sent' ? 'expired' : q.status;

              return (
                <Link
                  key={q.id}
                  to={`/portal/quotations/${q.id}`}
                  className="block portal-order-card hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-primary">
                      {q.quotation_number}
                    </span>
                    <span
                      className={STATUS_BADGE[displayStatus] ?? 'portal-badge'}
                    >
                      {STATUS_LABEL[displayStatus] ?? displayStatus}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="text-xs text-gray-500 space-y-0.5">
                      <div>
                        Gửi: {dayjs(q.quotation_date).format('DD/MM/YYYY')}
                      </div>
                      {q.valid_until && (
                        <div
                          className={
                            isExpired ? 'text-red-500 font-medium' : ''
                          }
                        >
                          Hạn: {dayjs(q.valid_until).format('DD/MM/YYYY')}
                        </div>
                      )}
                    </div>
                    <div className="font-bold text-gray-800">
                      {formatCurrency(q.total_amount)} đ
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
