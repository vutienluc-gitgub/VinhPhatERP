import { APPROVAL_STATUS } from '@/domains/approval/models/constants';
import { eventPublisher } from '@/domains/approval/services/domain-event-publisher';
import { NotificationService } from '@/domains/notification/services/notification-service';
import { ApprovalEvent } from '@/domains/approval/models/types';
import { ApprovalRepository } from '@/domains/approval/repositories/approval-repository';

export class NotificationSubscriber {
  static isInitialized = false;

  static init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Subscribe to Event Bus
    eventPublisher.subscribe(
      'ApprovalSubmitted',
      this.handleApprovalSubmitted.bind(this),
    );
    eventPublisher.subscribe(
      'ApprovalStepApproved',
      this.handleStepApproved.bind(this),
    );
    eventPublisher.subscribe(
      'ApprovalApproved',
      this.handleFinalized.bind(this),
    );
    eventPublisher.subscribe(
      'ApprovalRejected',
      this.handleFinalized.bind(this),
    );
    eventPublisher.subscribe(
      'ApprovalCancelled',
      this.handleFinalized.bind(this),
    );
    eventPublisher.subscribe(
      'ApprovalDelegated',
      this.handleDelegated.bind(this),
    );
    eventPublisher.subscribe(
      'ApprovalSlaBreached',
      this.handleSlaBreached.bind(this),
    );
    eventPublisher.subscribe(
      'ApprovalEscalated',
      this.handleEscalated.bind(this),
    );
  }

  private static async handleApprovalSubmitted(event: ApprovalEvent) {
    await this.notifyNextSteps(event.request.id, 'Yêu cầu duyệt mới');
  }

  private static async handleStepApproved(event: ApprovalEvent) {
    await this.notifyNextSteps(event.request.id, 'Đến lượt bạn duyệt');
  }

  private static async notifyNextSteps(
    requestId: string,
    title: string,
    priority: 'normal' | 'high' | 'urgent' = 'high',
  ) {
    try {
      const steps = await ApprovalRepository.getStepsByRequestId(requestId);
      const pendingSteps = steps.filter(
        (s) => s.status === APPROVAL_STATUS.PENDING,
      );
      if (pendingSteps.length === 0) return;

      pendingSteps.sort((a, b) => a.step_order - b.step_order);
      const firstStep = pendingSteps[0];
      if (!firstStep) return;

      const nextOrder = firstStep.step_order;
      const activeSteps = pendingSteps.filter(
        (s) => s.step_order === nextOrder,
      );

      for (const step of activeSteps) {
        if (!step || !step.delegated_to_user_id) continue;
        await NotificationService.dispatch({
          user_id: step.delegated_to_user_id,
          domain: 'approval',
          type: 'approval_step_pending',
          priority,
          title,
          body: `Có yêu cầu duyệt đang chờ xử lý ở bước ${step.role_name || step.role}.`,
          entity_type: 'approval_request',
          entity_id: requestId,
          action: 'approve',
        });
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[NotificationSubscriber] Failed to notify next steps', e);
    }
  }

  private static async handleFinalized(event: ApprovalEvent) {
    try {
      let title = '';
      if (event.event_type === 'ApprovalApproved')
        title = 'Yêu cầu đã được duyệt';
      if (event.event_type === 'ApprovalRejected') title = 'Yêu cầu bị từ chối';
      if (event.event_type === 'ApprovalCancelled') title = 'Yêu cầu đã bị hủy';

      if (!event.request.created_by) return;

      await NotificationService.dispatch({
        user_id: event.request.created_by,
        domain: 'approval',
        type: 'approval_finalized',
        priority: 'normal',
        title,
        body: `Yêu cầu duyệt ${event.request.resource_type} #${event.request.resource_id} đã có kết quả.`,
        entity_type: 'approval_request',
        entity_id: event.request.id,
        action: 'view',
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[NotificationSubscriber] Failed to handleFinalized', e);
    }
  }

  private static async handleDelegated(event: ApprovalEvent) {
    try {
      const delegatedTo = event.history.payload.delegated_to as string;
      if (!delegatedTo) return;

      await NotificationService.dispatch({
        user_id: delegatedTo,
        domain: 'approval',
        type: 'approval_delegated',
        priority: 'high',
        title: 'Được ủy quyền duyệt',
        body: `Bạn được ủy quyền xử lý bước duyệt cho yêu cầu ${event.request.resource_type} #${event.request.resource_id}.`,
        entity_type: 'approval_request',
        entity_id: event.request.id,
        action: 'approve',
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[NotificationSubscriber] Failed to handleDelegated', e);
    }
  }

  private static async handleSlaBreached(event: ApprovalEvent) {
    await this.notifyNextSteps(
      event.request.id,
      'CẢNH BÁO QUÁ HẠN DUYỆT',
      'urgent',
    );
  }

  private static async handleEscalated(event: ApprovalEvent) {
    await this.notifyNextSteps(
      event.request.id,
      'Yêu cầu duyệt đã được chuyển cấp lên bạn',
      'urgent',
    );
  }
}
