import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';

import { WorkflowRepository } from '@/domains/approval/repositories/workflow-repository';
import { ApprovalWorkflow } from '@/domains/approval/models/types';
import { Button } from '@/shared/components/Button';
import { Icon } from '@/shared/components/Icon';
import { Badge } from '@/shared/components/Badge';

export function ApprovalWorkflowsPage() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await WorkflowRepository.getAllWorkflows();
      setWorkflows(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Không thể tải danh sách quy trình: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const seeded = await WorkflowRepository.seedDefaultWorkflowsIfEmpty();
      setWorkflows(seeded);
      toast.success(
        `Đã khởi tạo thành công ${seeded.length} quy trình mẫu chuẩn ERP!`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Khởi tạo thất bại: ${msg}`);
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeCount = workflows.filter((w) => w.is_active).length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header & Sub-navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Phân hệ Quản lý & Cấu hình Phê duyệt
          </h1>
          <p className="text-muted mt-1 text-sm">
            Thiết kế luồng duyệt đa cấp, ràng buộc SLA và quản trị toàn diện quy
            trình nghiệp vụ.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {workflows.length === 0 && (
            <Button
              variant="outline"
              onClick={handleSeedDefaults}
              disabled={seeding || loading}
            >
              <Icon name="Sparkles" className="w-4 h-4 mr-2 text-warning" />
              {seeding ? 'Đang nạp mẫu...' : 'Nạp quy trình mẫu ERP'}
            </Button>
          )}
          <Button
            onClick={() => navigate('/system/approval/workflows/designer')}
          >
            <Icon name="Plus" className="w-4 h-4 mr-2" />
            Tạo quy trình mới
          </Button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-default gap-6 text-sm font-medium">
        <button
          className="pb-3 border-b-2 border-primary text-primary flex items-center gap-2"
          onClick={() => navigate('/system/approval/workflows')}
        >
          <Icon name="GitBranch" className="w-4 h-4" />
          Danh mục Quy trình ({workflows.length})
        </button>
        <button
          className="pb-3 border-b-2 border-transparent text-muted hover:text-foreground flex items-center gap-2 transition-colors"
          onClick={() => navigate('/system/approval/history')}
        >
          <Icon name="History" className="w-4 h-4" />
          Nhật ký & Lịch sử duyệt
        </button>
        <button
          className="pb-3 border-b-2 border-transparent text-muted hover:text-foreground flex items-center gap-2 transition-colors"
          onClick={() => navigate('/system/approval/poc')}
        >
          <Icon name="TestTube2" className="w-4 h-4" />
          Phòng thử nghiệm PoC & SLA
        </button>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-surface border border-default rounded-lg shadow-sm">
          <div className="text-xs text-muted font-medium uppercase tracking-wider">
            Tổng quy trình
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {loading ? '...' : workflows.length}
          </div>
          <div className="text-xs text-muted mt-1">
            Đã định nghĩa trong hệ thống
          </div>
        </div>
        <div className="p-4 bg-surface border border-default rounded-lg shadow-sm">
          <div className="text-xs text-muted font-medium uppercase tracking-wider">
            Đang hoạt động
          </div>
          <div className="text-2xl font-bold text-success mt-1">
            {loading ? '...' : activeCount}
          </div>
          <div className="text-xs text-muted mt-1">
            Sẵn sàng nhận tài liệu duyệt
          </div>
        </div>
        <div className="p-4 bg-surface border border-default rounded-lg shadow-sm">
          <div className="text-xs text-muted font-medium uppercase tracking-wider">
            Cơ chế bảo vệ
          </div>
          <div className="text-2xl font-bold text-info mt-1">SLA + Outbox</div>
          <div className="text-xs text-muted mt-1">
            Giao dịch nguyên tử ACID Level 9
          </div>
        </div>
      </div>

      {/* Content List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-surface border border-default rounded-lg">
          <Icon
            name="Loader2"
            className="w-8 h-8 animate-spin text-primary mb-2"
          />
          <span className="text-sm text-muted">
            Đang tải danh sách quy trình phê duyệt...
          </span>
        </div>
      ) : (
        <div className="grid gap-4">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              className="p-5 bg-surface border border-default rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-lg text-foreground">
                    {wf.name}
                  </h3>
                  <Badge variant={wf.is_active ? 'success' : 'gray'}>
                    {wf.is_active ? 'Đang hoạt động' : 'Tạm dừng'}
                  </Badge>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-surface-secondary border border-default text-muted">
                    Phiên bản {wf.version}
                  </span>
                </div>
                <div className="text-sm text-muted">
                  Mã hệ thống:{' '}
                  <code className="bg-surface-secondary px-2 py-0.5 rounded text-foreground font-mono text-xs">
                    {wf.workflow_key}
                  </code>
                </div>
                {wf.description && (
                  <p className="text-sm text-muted max-w-2xl">
                    {wf.description}
                  </p>
                )}
                <div className="text-xs text-muted flex items-center gap-1">
                  <Icon name="Clock" className="w-3.5 h-3.5" />
                  Thời gian cập nhật:{' '}
                  {format(
                    new Date(wf.updated_at || wf.created_at),
                    'dd/MM/yyyy HH:mm',
                    { locale: vi },
                  )}
                </div>
              </div>
              <div className="shrink-0 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate(`/system/approval/workflows/designer?id=${wf.id}`)
                  }
                >
                  <Icon name="Edit3" className="w-4 h-4 mr-2" />
                  Cấu hình sơ đồ
                </Button>
              </div>
            </div>
          ))}

          {workflows.length === 0 && (
            <div className="text-center p-12 bg-surface-secondary border border-default rounded-lg border-dashed space-y-4">
              <Icon
                name="GitBranch"
                className="w-12 h-12 text-muted mx-auto opacity-50"
              />
              <div>
                <p className="text-foreground font-semibold text-base">
                  Hệ thống chưa có quy trình phê duyệt nào
                </p>
                <p className="text-muted text-sm mt-1 max-w-md mx-auto">
                  Bạn có thể tạo quy trình tùy biến bằng trình thiết kế Low-Code
                  hoặc bấm nạp sẵn bộ quy trình chuẩn ERP cho dệt may.
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleSeedDefaults}
                  disabled={seeding}
                >
                  <Icon name="Sparkles" className="w-4 h-4 mr-2 text-warning" />
                  {seeding ? 'Đang nạp...' : 'Khởi tạo quy trình chuẩn ERP'}
                </Button>
                <Button
                  onClick={() =>
                    navigate('/system/approval/workflows/designer')
                  }
                >
                  <Icon name="Plus" className="w-4 h-4 mr-2" />
                  Thiết kế quy trình mới
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
