import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';

import {
  HistoryRepository,
  ApprovalHistoryWithRequest,
} from '@/domains/approval/repositories/history-repository';
import { Button } from '@/shared/components/Button';
import { Icon } from '@/shared/components/Icon';
import { Badge } from '@/shared/components/Badge';
import { VPSelect, VPOption } from '@/shared/components/VPSelect';

const RESOURCE_OPTIONS: VPOption<string>[] = [
  { value: 'ALL', label: 'Tất cả phân hệ' },
  { value: 'expense_request', label: 'Chi tiêu / Tạm ứng' },
  { value: 'purchase_order', label: 'Đơn mua hàng PO' },
  { value: 'purchase_request', label: 'Yêu cầu vật tư PR' },
  { value: 'order', label: 'Đơn bán hàng' },
];

const EVENT_OPTIONS: VPOption<string>[] = [
  { value: 'ALL', label: 'Tất cả sự kiện' },
  { value: 'APPROVED', label: 'Đã duyệt (Tất cả bước)' },
  { value: 'ApprovalRejected', label: 'Từ chối' },
  { value: 'ApprovalSubmitted', label: 'Trình duyệt' },
  { value: 'ApprovalCancelled', label: 'Đã hủy' },
  { value: 'ApprovalSlaBreached', label: 'Quá hạn SLA' },
];

export function ApprovalHistoryPage() {
  const navigate = useNavigate();
  const [histories, setHistories] = useState<ApprovalHistoryWithRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [resourceFilter, setResourceFilter] = useState('ALL');
  const [eventFilter, setEventFilter] = useState('ALL');
  const [selectedHistory, setSelectedHistory] =
    useState<ApprovalHistoryWithRequest | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await HistoryRepository.getAllHistories({ limit: 200 });
      setHistories(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Không thể tải nhật ký phê duyệt: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredHistories = useMemo(() => {
    return histories.filter((item) => {
      // 1. Resource filter
      if (resourceFilter !== 'ALL') {
        const itemRes =
          item.request?.resource_type ||
          (item.payload as Record<string, unknown>)?.resource_type;
        if (itemRes !== resourceFilter) return false;
      }

      // 2. Event filter
      if (eventFilter !== 'ALL') {
        if (eventFilter === 'APPROVED') {
          if (
            item.event_type !== 'ApprovalApproved' &&
            item.event_type !== 'ApprovalStepApproved'
          )
            return false;
        } else if (item.event_type !== eventFilter) {
          return false;
        }
      }

      // 3. Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const resId = (
          item.request?.resource_id ||
          (item.payload as Record<string, unknown>)?.resource_id ||
          ''
        )
          .toString()
          .toLowerCase();
        const actorName = (item.actor_snapshot?.name || '').toLowerCase();
        const actorEmail = (item.actor_snapshot?.email || '').toLowerCase();
        const comment = (
          (item.payload as Record<string, unknown>)?.comment || ''
        )
          .toString()
          .toLowerCase();

        return (
          resId.includes(query) ||
          actorName.includes(query) ||
          actorEmail.includes(query) ||
          comment.includes(query)
        );
      }

      return true;
    });
  }, [histories, resourceFilter, eventFilter, searchTerm]);

  // KPI Calculations
  const totalCount = histories.length;
  const approvedCount = histories.filter(
    (h) =>
      h.event_type === 'ApprovalApproved' ||
      h.event_type === 'ApprovalStepApproved',
  ).length;
  const rejectedCount = histories.filter(
    (h) => h.event_type === 'ApprovalRejected',
  ).length;
  const cancelledCount = histories.filter(
    (h) => h.event_type === 'ApprovalCancelled',
  ).length;

  const renderEventBadge = (eventType: string) => {
    switch (eventType) {
      case 'ApprovalApproved':
        return <Badge variant="success">Hoàn tất duyệt</Badge>;
      case 'ApprovalStepApproved':
        return <Badge variant="info">Duyệt bước</Badge>;
      case 'ApprovalRejected':
        return <Badge variant="danger">Từ chối</Badge>;
      case 'ApprovalCancelled':
        return <Badge variant="gray">Đã hủy</Badge>;
      case 'ApprovalSubmitted':
        return <Badge variant="warning">Trình duyệt</Badge>;
      case 'ApprovalDelegated':
        return <Badge variant="info">Ủy quyền</Badge>;
      case 'ApprovalSlaBreached':
        return <Badge variant="danger">Quá hạn SLA</Badge>;
      default:
        return <Badge variant="gray">{eventType}</Badge>;
    }
  };

  const getResourceLabel = (resType?: string) => {
    switch (resType) {
      case 'expense_request':
        return 'Chi tiêu / Tạm ứng';
      case 'purchase_order':
        return 'Đơn mua hàng PO';
      case 'purchase_request':
        return 'Yêu cầu mua vật tư PR';
      case 'order':
        return 'Đơn bán hàng';
      default:
        return resType || 'Tài liệu';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Nhật ký & Lịch sử Phê duyệt Toàn hệ thống
          </h1>
          <p className="text-muted mt-1 text-sm">
            Tra cứu vết kiểm toán (Audit Trail) của toàn bộ tài liệu và quyết
            định phê duyệt.
          </p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={loading}>
          <Icon
            name="RefreshCw"
            className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
          />
          Làm mới dữ liệu
        </Button>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-default gap-6 text-sm font-medium">
        <button
          className="pb-3 border-b-2 border-transparent text-muted hover:text-foreground flex items-center gap-2 transition-colors"
          onClick={() => navigate('/system/approval/workflows')}
        >
          <Icon name="GitBranch" className="w-4 h-4" />
          Danh mục Quy trình
        </button>
        <button
          className="pb-3 border-b-2 border-primary text-primary flex items-center gap-2"
          onClick={() => navigate('/system/approval/history')}
        >
          <Icon name="History" className="w-4 h-4" />
          Nhật ký & Lịch sử duyệt ({histories.length})
        </button>
        <button
          className="pb-3 border-b-2 border-transparent text-muted hover:text-foreground flex items-center gap-2 transition-colors"
          onClick={() => navigate('/system/approval/poc')}
        >
          <Icon name="TestTube2" className="w-4 h-4" />
          Phòng thử nghiệm PoC & SLA
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-surface border border-default rounded-lg shadow-sm">
          <div className="text-xs text-muted font-medium uppercase tracking-wider">
            Tổng lượt xử lý
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {loading ? '...' : totalCount}
          </div>
          <div className="text-xs text-muted mt-1">
            Toàn bộ sự kiện phê duyệt
          </div>
        </div>
        <div className="p-4 bg-surface border border-default rounded-lg shadow-sm">
          <div className="text-xs text-muted font-medium uppercase tracking-wider">
            Đã duyệt
          </div>
          <div className="text-2xl font-bold text-success mt-1">
            {loading ? '...' : approvedCount}
          </div>
          <div className="text-xs text-muted mt-1">Đồng ý & thông qua</div>
        </div>
        <div className="p-4 bg-surface border border-default rounded-lg shadow-sm">
          <div className="text-xs text-muted font-medium uppercase tracking-wider">
            Từ chối duyệt
          </div>
          <div className="text-2xl font-bold text-danger mt-1">
            {loading ? '...' : rejectedCount}
          </div>
          <div className="text-xs text-muted mt-1">Yêu cầu bị bác bỏ</div>
        </div>
        <div className="p-4 bg-surface border border-default rounded-lg shadow-sm">
          <div className="text-xs text-muted font-medium uppercase tracking-wider">
            Đã hủy bỏ
          </div>
          <div className="text-2xl font-bold text-muted mt-1">
            {loading ? '...' : cancelledCount}
          </div>
          <div className="text-xs text-muted mt-1">Người lập tự hủy</div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 bg-surface border border-default rounded-lg flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Icon
            name="Search"
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, người duyệt, ghi chú..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-secondary border border-default rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-sm text-muted min-w-[200px]">
            <span className="shrink-0">Phân hệ:</span>
            <div className="w-44">
              <VPSelect<string>
                options={RESOURCE_OPTIONS}
                value={resourceFilter}
                onValueChange={(val) => setResourceFilter(val)}
                size="sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted min-w-[220px]">
            <span className="shrink-0">Sự kiện:</span>
            <div className="w-48">
              <VPSelect<string>
                options={EVENT_OPTIONS}
                value={eventFilter}
                onValueChange={(val) => setEventFilter(val)}
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* History Data Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-surface border border-default rounded-lg">
          <Icon
            name="Loader2"
            className="w-8 h-8 animate-spin text-primary mb-2"
          />
          <span className="text-sm text-muted">
            Đang tải nhật ký kiểm toán...
          </span>
        </div>
      ) : filteredHistories.length === 0 ? (
        <div className="text-center p-12 bg-surface-secondary border border-default rounded-lg border-dashed space-y-3">
          <Icon
            name="Inbox"
            className="w-12 h-12 text-muted mx-auto opacity-50"
          />
          <p className="text-foreground font-medium text-base">
            Không tìm thấy nhật ký phê duyệt phù hợp
          </p>
          <p className="text-muted text-sm">
            Thử thay đổi bộ lọc tìm kiếm hoặc thực hiện quy trình trình duyệt từ
            các phân hệ nghiệp vụ.
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-default rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-default bg-surface-secondary text-muted text-xs font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3">Tài liệu / Đơn</th>
                  <th className="px-4 py-3">Sự kiện</th>
                  <th className="px-4 py-3">Người thực hiện</th>
                  <th className="px-4 py-3">Nội dung / Ý kiến</th>
                  <th className="px-4 py-3 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default">
                {filteredHistories.map((item) => {
                  const resType =
                    item.request?.resource_type ||
                    (item.payload as Record<string, unknown>)?.resource_type;
                  const resId =
                    item.request?.resource_id ||
                    (item.payload as Record<string, unknown>)?.resource_id ||
                    'N/A';
                  const comment =
                    (item.payload as Record<string, unknown>)?.comment ||
                    (item.payload as Record<string, unknown>)?.reason ||
                    '';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-surface-secondary/50 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-muted text-xs font-mono">
                        {format(
                          new Date(item.created_at),
                          'dd/MM/yyyy HH:mm:ss',
                          { locale: vi },
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-foreground">
                          {String(resId)}
                        </div>
                        <div className="text-xs text-muted">
                          {getResourceLabel(String(resType))}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {renderEventBadge(item.event_type)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground text-xs">
                          {item.actor_snapshot?.name || 'Hệ thống'}
                        </div>
                        <div className="text-xs text-muted">
                          {item.actor_snapshot?.role ? (
                            <span className="capitalize">
                              {item.actor_snapshot.role}
                            </span>
                          ) : (
                            item.actor_snapshot?.email || 'Tự động'
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate text-muted text-xs">
                        {comment ? String(comment) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedHistory(item)}
                        >
                          <Icon name="Eye" className="w-4 h-4 mr-1" />
                          Xem vết
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-default bg-surface-secondary text-xs text-muted flex justify-between items-center">
            <span>Hiển thị {filteredHistories.length} sự kiện gần nhất</span>
            <span>Bảo chứng bởi Audit Log Engine</span>
          </div>
        </div>
      )}

      {/* Detail Snapshot Modal */}
      {selectedHistory && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-default rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-default flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-foreground">
                  Chi tiết Vết Kiểm toán Phê duyệt
                </h3>
                <p className="text-xs text-muted mt-0.5 font-mono">
                  Sự kiện ID: {selectedHistory.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedHistory(null)}
                className="p-1.5 hover:bg-surface-secondary rounded-lg text-muted hover:text-foreground transition-colors"
              >
                <Icon name="X" className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-sm">
              <div className="grid grid-cols-2 gap-4 bg-surface-secondary p-4 rounded-lg border border-default">
                <div>
                  <span className="text-xs text-muted block">Sự kiện:</span>
                  <div className="mt-1">
                    {renderEventBadge(selectedHistory.event_type)}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted block">
                    Thời điểm ghi nhận:
                  </span>
                  <span className="font-semibold text-foreground text-xs mt-1 block font-mono">
                    {format(
                      new Date(selectedHistory.created_at),
                      'dd/MM/yyyy HH:mm:ss',
                      { locale: vi },
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted block">
                    Người thực hiện:
                  </span>
                  <span className="font-medium text-foreground text-xs mt-1 block">
                    {selectedHistory.actor_snapshot?.name || 'Hệ thống'} (
                    {selectedHistory.actor_snapshot?.role || 'N/A'})
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted block">Email:</span>
                  <span className="text-xs text-muted mt-1 block">
                    {selectedHistory.actor_snapshot?.email || 'N/A'}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-foreground text-sm block mb-2">
                  Dữ liệu Snapshot Payload:
                </span>
                <pre className="bg-surface-secondary p-4 rounded-lg border border-default text-xs font-mono text-foreground overflow-x-auto max-h-64">
                  {JSON.stringify(selectedHistory.payload, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-default bg-surface-secondary flex justify-end">
              <Button onClick={() => setSelectedHistory(null)}>
                Đóng cửa sổ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
