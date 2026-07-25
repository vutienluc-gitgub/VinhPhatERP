import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { WorkflowRepository } from '@/domains/approval/repositories/workflow-repository';
import { ApprovalWorkflow } from '@/domains/approval/models/types';
import { Button } from '@/shared/components/Button';
import { Icon } from '@/shared/components/Icon';
import { Badge } from '@/shared/components/Badge';

export function ApprovalWorkflowsPage() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const data = await WorkflowRepository.getAllWorkflows();
      setWorkflows(data);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Cấu hình Quy trình duyệt
          </h1>
          <p className="text-muted mt-1 text-sm">
            Quản lý và thiết kế các quy trình phê duyệt trong hệ thống.
          </p>
        </div>
        <Button onClick={() => navigate('/system/approval/workflows/designer')}>
          <Icon name="Plus" className="w-4 h-4 mr-2" />
          Tạo quy trình mới
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <Icon name="Loader2" className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              className="p-4 bg-surface border border-default rounded-lg flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-lg text-foreground">
                    {wf.name}
                  </h3>
                  <Badge variant={wf.is_active ? 'success' : 'gray'}>
                    {wf.is_active ? 'Đang hoạt động' : 'Tạm dừng'}
                  </Badge>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-surface-secondary border border-default text-muted">
                    v{wf.version}
                  </span>
                </div>
                <div className="text-sm text-muted mb-2">
                  Key:{' '}
                  <code className="bg-surface-secondary px-1 rounded">
                    {wf.workflow_key}
                  </code>
                </div>
                {wf.description && (
                  <p className="text-sm text-foreground mb-2">
                    {wf.description}
                  </p>
                )}
                <div className="text-xs text-muted flex items-center gap-1">
                  <Icon name="Clock" className="w-3 h-3" />
                  Cập nhật:{' '}
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
                  Chỉnh sửa
                </Button>
              </div>
            </div>
          ))}
          {workflows.length === 0 && (
            <div className="text-center p-12 bg-surface-secondary border border-default rounded-lg border-dashed">
              <Icon
                name="Settings2"
                className="w-12 h-12 text-muted mx-auto mb-3 opacity-50"
              />
              <p className="text-foreground font-medium mb-1">
                Chưa có quy trình nào
              </p>
              <p className="text-muted text-sm">
                Bấm "Tạo quy trình mới" để bắt đầu thiết kế luồng duyệt.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
