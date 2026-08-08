import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '@/shared/hooks/useAuth';
import { ApprovalEngine } from '@/domains/approval/services/approval-engine';
import { WorkflowRepository } from '@/domains/approval/repositories/workflow-repository';
import { ApprovalRepository } from '@/domains/approval/repositories/approval-repository';
import { HistoryRepository } from '@/domains/approval/repositories/history-repository';
import { eventPublisher } from '@/domains/approval/services/domain-event-publisher';
import { NotificationSubscriber } from '@/domains/notification/services/notification-subscriber';
import { untypedDb } from '@/services/supabase/untyped';
import { ApprovalStatusBadge } from '@/domains/approval/ui/ApprovalStatusBadge';
import { ApprovalTimeline } from '@/domains/approval/ui/ApprovalTimeline';
import { ApprovalActions } from '@/domains/approval/ui/ApprovalActions';
import { ApprovalWorkflowViewer } from '@/domains/approval/ui/ApprovalWorkflowViewer';
import {
  ApprovalRequest,
  ApprovalWorkflow,
  ApprovalWorkflowStep,
  ApprovalStep,
  ApprovalHistory,
  Notification,
} from '@/domains/approval/models/types';

export function ApprovalPoCPage() {
  const { user } = useAuth();

  // Mock Resource
  const resourceType = 'expense_request';
  const resourceId = 'EXP-2026-001';
  const workflowKey = 'EXPENSE_STANDARD';

  const [request, setRequest] = useState<ApprovalRequest | null>(null);
  const [workflow, setWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<ApprovalWorkflowStep[]>(
    [],
  );
  const [approvalSteps, setApprovalSteps] = useState<ApprovalStep[]>([]);
  const [histories, setHistories] = useState<ApprovalHistory[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Setup mock workflow if it doesn't exist (only for PoC)
  const setupMockWorkflow = async () => {
    try {
      const existing = await WorkflowRepository.getActiveWorkflow(workflowKey);
      if (existing) return;

      const { safeUpsertOne } = await import('@/lib/db-guard');
      const wf = (await safeUpsertOne({
        table: 'approval_workflows',
        conflictKey: 'workflow_key,version',
        data: {
          id: crypto.randomUUID(),
          workflow_key: workflowKey,
          version: 1,
          name: 'Quy trình chuẩn chi tiêu',
          description: 'Duyệt chi tiêu nội bộ',
          is_active: true,
        },
      })) as ApprovalWorkflow;

      await safeUpsertOne({
        table: 'approval_workflow_steps',
        conflictKey: 'workflow_id,step_order',
        data: {
          id: crypto.randomUUID(),
          workflow_id: wf.id,
          role: 'manager',
          step_order: 1,
          description: 'Quản lý duyệt',
        },
      });
      await safeUpsertOne({
        table: 'approval_workflow_steps',
        conflictKey: 'workflow_id,step_order',
        data: {
          id: crypto.randomUUID(),
          workflow_id: wf.id,
          role: 'admin',
          step_order: 2,
          description: 'Giám đốc duyệt',
        },
      });
    } catch (e) {
      console.error('Mock workflow setup failed', e);
    }
  };

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await setupMockWorkflow();
      const wf = await WorkflowRepository.getActiveWorkflow(workflowKey);
      if (wf) {
        setWorkflow(wf);
        const wfSteps = await WorkflowRepository.getWorkflowSteps(wf.id);
        setWorkflowSteps(wfSteps);
      }

      const req = await ApprovalRepository.getRequestByResource(
        resourceType,
        resourceId,
      );
      setRequest(req);

      if (req) {
        const aSteps = await ApprovalRepository.getStepsByRequestId(req.id);
        setApprovalSteps(aSteps);

        const h = await HistoryRepository.getHistoryByRequestId(req.id);
        setHistories(h);
      }
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi tải PoC data');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadData();
    NotificationSubscriber.init();

    if (user) {
      untypedDb
        .from('notifications')
        .select('*')
        .or(`target_user_id.eq.${user.id},target_role.eq.${user.role}`)
        .order('created_at', { ascending: false })
        .limit(5)
        .then(({ data }) => setNotifications(data || []));
    }

    // Subscribe to events (Simulating Business Module listening to events)
    eventPublisher.subscribe('ApprovalApproved', () => {
      toast.success('SỰ KIỆN: Business Module nhận được ApprovalApproved!');
      loadData(); // Reload UI
    });
    eventPublisher.subscribe('ApprovalRejected', () => {
      toast.error('SỰ KIỆN: Business Module nhận được ApprovalRejected!');
      loadData();
    });
    eventPublisher.subscribe('ApprovalStepApproved', () => {
      toast.success('SỰ KIỆN: Bước duyệt đã hoàn tất!');
      loadData();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;
    try {
      toast.loading('Đang trình duyệt...');
      await ApprovalEngine.submit(
        resourceType,
        resourceId,
        'v1',
        workflowKey,
        {
          document: { amount: 5000000 },
          workflow: {
            workflow_key: workflowKey,
            version: 1,
            name: 'Quy trình chuẩn',
          },
          approvers: {},
          metadata: {},
        },
        user.id,
        {
          id: user.id,
          name: user.email || 'Test User',
          role: user.role || 'staff',
        },
      );
      toast.dismiss();
      toast.success('Đã trình duyệt');
      loadData();
    } catch (e) {
      toast.dismiss();
      toast.error(String(e));
    }
  };

  const handleApprove = async (comment: string) => {
    if (!user || !request) return;

    // Note: We bypass strict role check here for PoC testing ease, but we pass the actual user snapshot
    await ApprovalEngine.approve(
      request.id,
      { id: user.id, name: user.email || 'Test User', role: 'manager' }, // Forcing role to 'manager' to pass the step
      comment,
    );
  };

  const handleReject = async (comment: string) => {
    if (!user || !request) return;
    await ApprovalEngine.reject(
      request.id,
      { id: user.id, name: user.email || 'Test User', role: 'manager' },
      comment,
    );
  };

  const handleDelegate = async (delegateeId: string, comment: string) => {
    if (!user || !request) return;
    await ApprovalEngine.delegate(
      request.id,
      ['manager'],
      user.id,
      delegateeId,
      { id: user.id, name: user.email || 'Test User', role: 'manager' },
      comment,
    );
    loadData();
  };

  if (loading) return <div className="p-6">Đang tải Proof of Concept...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Proof of Concept: Approval Engine
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={async () => {
              await ApprovalEngine.processEscalations();
              loadData();
            }}
            className="px-3 py-1.5 text-sm font-medium bg-warning text-warning-foreground hover:bg-warning/90 rounded-md transition-colors"
          >
            Chạy Cron Job (Test SLA)
          </button>
          {request && <ApprovalStatusBadge status={request.status} />}
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="p-4 bg-info-soft border border-info rounded-lg">
          <h2 className="text-sm font-bold text-info mb-2 flex items-center gap-2">
            🔔 Thông báo mới nhất
          </h2>
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id} className="text-sm text-foreground">
                <span className="font-semibold">{n.title}:</span> {n.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="p-6 bg-surface-secondary border border-default rounded-lg">
        <h2 className="text-lg font-semibold mb-2">
          Tài liệu giả lập: Đề xuất chi tiêu #{resourceId}
        </h2>
        <p className="text-muted-foreground mb-4">Số tiền: 5,000,000 VNĐ</p>

        {!request && (
          <button
            onClick={handleSubmit}
            className="px-4 py-2 font-medium text-inverse-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors"
          >
            Trình duyệt ngay
          </button>
        )}
      </div>

      {workflow && (
        <ApprovalWorkflowViewer workflow={workflow} steps={workflowSteps} />
      )}

      {request && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-surface-secondary border border-default rounded-lg">
            <h3 className="text-md font-medium mb-4">
              Timeline (Approval Engine)
            </h3>
            <ApprovalTimeline steps={approvalSteps} histories={histories} />
          </div>

          <div>
            <ApprovalActions
              request={request}
              canApprove={true} // Bypassed for PoC UI testing
              canReject={true}
              onApprove={handleApprove}
              onReject={handleReject}
              onDelegate={handleDelegate}
            />
            <p className="text-xs text-muted-foreground mt-4">
              *Trong thực tế, nút Duyệt sẽ bị ẩn nếu user không có quyền
              canApprove().
              <br />
              (Cho PoC này, nút Duyệt luôn hiển thị để test flow Event Bus).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
