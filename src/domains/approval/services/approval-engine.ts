import { ApprovalRepository } from '@/domains/approval/repositories/approval-repository';
import { WorkflowRepository } from '@/domains/approval/repositories/workflow-repository';
import { ExpressionEvaluator } from '@/domains/approval/utils/expression-evaluator';
import { APPROVAL_STATUS } from '@/domains/approval/models/constants';
import {
  ApprovalRequest,
  ApprovalStep,
  ApproverSnapshot,
  ApprovalSnapshotData,
  ApprovalHistory,
  ApprovalOutboxEvent,
} from '@/domains/approval/models/types';

import { OutboxWorker } from './outbox-worker';

export class ApprovalEngine {
  static async canSubmit(
    resourceType: string,
    resourceId: string,
    _userId: string,
  ): Promise<boolean> {
    const existing = await ApprovalRepository.getRequestByResource(
      resourceType,
      resourceId,
    );
    return !existing || existing.status === APPROVAL_STATUS.DRAFT;
  }

  static async submit(
    resourceType: string,
    resourceId: string,
    resourceVersion: string | null,
    workflowKey: string,
    snapshotData: ApprovalSnapshotData,
    userId: string,
    actorSnapshot: ApproverSnapshot,
  ): Promise<ApprovalRequest> {
    const workflow = await WorkflowRepository.getActiveWorkflow(workflowKey);
    if (!workflow)
      throw new Error(
        `[ApprovalEngine] Active workflow not found for key: ${workflowKey}`,
      );

    const workflowSteps = await WorkflowRepository.getWorkflowSteps(
      workflow.id,
    );
    if (workflowSteps.length === 0)
      throw new Error(
        `[ApprovalEngine] Workflow ${workflow.name} has no steps.`,
      );

    const request: Partial<ApprovalRequest> & { id: string } = {
      id: crypto.randomUUID(),
      resource_type: resourceType,
      resource_id: resourceId,
      resource_version: resourceVersion,
      workflow_id: workflow.id,
      workflow_version: workflow.version,
      status: APPROVAL_STATUS.PENDING,
      snapshot_data: snapshotData,
      row_version: 1,
      created_by: userId,
    };

    const steps: (Partial<ApprovalStep> & { id: string })[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validWs = workflowSteps.filter((ws) =>
      ExpressionEvaluator.evaluate(
        ws.conditions as unknown as any,
        snapshotData.document || {},
      ),
    );
    const minStepOrder =
      validWs.length > 0 ? Math.min(...validWs.map((ws) => ws.step_order)) : -1;

    for (const ws of validWs) {
      let deadline: string | undefined = undefined;
      if (ws.step_order === minStepOrder && ws.sla_hours) {
        const now = new Date();
        now.setMinutes(now.getMinutes() + Math.round(ws.sla_hours * 60));
        deadline = now.toISOString();
      }

      steps.push({
        id: crypto.randomUUID(),
        request_id: request.id,
        step_order: ws.step_order,
        role: ws.role,
        role_name: ws.description || ws.role,
        status: APPROVAL_STATUS.PENDING,
        is_parallel: ws.is_parallel || false,
        sla_hours: ws.sla_hours,
        escalation_action: ws.escalation_action,
        escalation_role: ws.escalation_role,
        deadline,
        created_at: new Date().toISOString(),
      });
    }

    if (steps.length === 0) {
      request.status = APPROVAL_STATUS.APPROVED;
      request.row_version = 2;
    }

    const eventType =
      request.status === APPROVAL_STATUS.APPROVED
        ? 'ApprovalApproved'
        : 'ApprovalSubmitted';
    const note =
      request.status === APPROVAL_STATUS.APPROVED
        ? 'Auto-approved (no conditions met)'
        : 'Submitted for approval';

    const history: Partial<ApprovalHistory> = {
      request_id: request.id,
      event_type: eventType,
      actor_snapshot: actorSnapshot,
      payload: { note },
    };

    const outboxEvent: Partial<ApprovalOutboxEvent> = {
      event_type: eventType,
      payload: { request, history },
    };

    await ApprovalRepository.executeTransaction(
      [request],
      steps,
      [history],
      [outboxEvent],
    );
    OutboxWorker.processPendingEvents().catch(console.error);

    return request as ApprovalRequest;
  }

  static async canApprove(
    requestId: string,
    userRoles: string[],
    userId?: string,
  ): Promise<boolean> {
    const request = await ApprovalRepository.getRequestById(requestId);
    if (!request || request.status !== APPROVAL_STATUS.PENDING) return false;

    const steps = await ApprovalRepository.getStepsByRequestId(requestId);
    steps.sort((a, b) => a.step_order - b.step_order);

    const pendingSteps = steps.filter(
      (s) => s.status === APPROVAL_STATUS.PENDING,
    );
    const firstPendingStep = pendingSteps[0];
    if (!firstPendingStep) return false;

    const currentStepOrder = firstPendingStep.step_order;
    const currentPendingSteps = pendingSteps.filter(
      (s) => s.step_order === currentStepOrder,
    );

    return currentPendingSteps.some(
      (s) =>
        userRoles.includes(s.role) ||
        (userId && s.delegated_to_user_id === userId),
    );
  }

  static async canReject(
    requestId: string,
    userRoles: string[],
    userId?: string,
  ): Promise<boolean> {
    return this.canApprove(requestId, userRoles, userId);
  }

  static async approve(
    requestId: string,
    actorSnapshot: ApproverSnapshot,
    comment?: string,
  ): Promise<ApprovalRequest> {
    const request = await ApprovalRepository.getRequestById(requestId);
    if (!request || request.status !== APPROVAL_STATUS.PENDING)
      throw new Error('[ApprovalEngine] Request is not in pending state.');

    const steps = await ApprovalRepository.getStepsByRequestId(requestId);
    steps.sort((a, b) => a.step_order - b.step_order);

    const pendingSteps = steps.filter(
      (s) => s.status === APPROVAL_STATUS.PENDING,
    );
    const firstPendingStep = pendingSteps[0];
    if (!firstPendingStep)
      throw new Error('[ApprovalEngine] No pending steps found.');

    const currentStepOrder = firstPendingStep.step_order;
    const pendingStep = pendingSteps.find(
      (s) =>
        s.step_order === currentStepOrder &&
        (s.role === actorSnapshot.role ||
          s.delegated_to_user_id === actorSnapshot.id),
    );

    if (!pendingStep)
      throw new Error(
        '[ApprovalEngine] You do not have permission to approve the current step.',
      );

    const stepUpdate: Partial<ApprovalStep> = {
      id: pendingStep.id,
      status: APPROVAL_STATUS.APPROVED,
      approver_snapshot: actorSnapshot,
      comment: comment || undefined,
      approved_at: new Date().toISOString(),
    };

    const remainingPendingSteps = pendingSteps.filter(
      (s) => s.id !== pendingStep.id,
    );
    const isFullyApproved = remainingPendingSteps.length === 0;
    const isNextOrderStarting =
      !isFullyApproved &&
      !remainingPendingSteps.some((s) => s.step_order === currentStepOrder);

    const stepsToUpdate = [stepUpdate];

    if (isNextOrderStarting) {
      const nextOrder = Math.min(
        ...remainingPendingSteps.map((s) => s.step_order),
      );
      const nextSteps = remainingPendingSteps.filter(
        (s) => s.step_order === nextOrder,
      );
      for (const ns of nextSteps) {
        if (ns.sla_hours) {
          const now = new Date();
          now.setMinutes(now.getMinutes() + Math.round(ns.sla_hours * 60));
          stepsToUpdate.push({ id: ns.id, deadline: now.toISOString() });
        }
      }
    }

    const updatedRequest: Partial<ApprovalRequest> = {
      id: request.id,
      status: isFullyApproved
        ? APPROVAL_STATUS.APPROVED
        : APPROVAL_STATUS.PENDING,
      row_version: request.row_version + 1,
    };

    const history: Partial<ApprovalHistory> = {
      request_id: request.id,
      event_type: isFullyApproved ? 'ApprovalApproved' : 'ApprovalStepApproved',
      actor_snapshot: actorSnapshot,
      payload: { comment, step_role: pendingStep.role },
    };

    const outboxEvent: Partial<ApprovalOutboxEvent> = {
      event_type: history.event_type as string,
      payload: { request: { ...request, ...updatedRequest }, history },
    };

    await ApprovalRepository.executeTransaction(
      [updatedRequest],
      stepsToUpdate,
      [history],
      [outboxEvent],
    );
    OutboxWorker.processPendingEvents().catch(console.error);

    return { ...request, ...updatedRequest } as ApprovalRequest;
  }

  static async reject(
    requestId: string,
    actorSnapshot: ApproverSnapshot,
    comment: string,
  ): Promise<ApprovalRequest> {
    const request = await ApprovalRepository.getRequestById(requestId);
    if (!request || request.status !== APPROVAL_STATUS.PENDING)
      throw new Error('[ApprovalEngine] Request is not in pending state.');

    const steps = await ApprovalRepository.getStepsByRequestId(requestId);
    steps.sort((a, b) => a.step_order - b.step_order);
    const pendingSteps = steps.filter(
      (s) => s.status === APPROVAL_STATUS.PENDING,
    );

    const firstPendingStep = pendingSteps[0];
    if (!firstPendingStep)
      throw new Error('[ApprovalEngine] No pending steps found.');

    const currentStepOrder = firstPendingStep.step_order;
    const pendingStep = pendingSteps.find(
      (s) =>
        s.step_order === currentStepOrder &&
        (s.role === actorSnapshot.role ||
          s.delegated_to_user_id === actorSnapshot.id),
    );

    if (!pendingStep)
      throw new Error(
        '[ApprovalEngine] You do not have permission to reject the current step.',
      );

    const stepUpdate: Partial<ApprovalStep> = {
      id: pendingStep.id,
      status: APPROVAL_STATUS.REJECTED,
      approver_snapshot: actorSnapshot,
      comment: comment || undefined,
      approved_at: new Date().toISOString(),
    };

    const updatedRequest: Partial<ApprovalRequest> = {
      id: request.id,
      status: APPROVAL_STATUS.REJECTED,
      row_version: request.row_version + 1,
    };

    const history: Partial<ApprovalHistory> = {
      request_id: request.id,
      event_type: 'ApprovalRejected',
      actor_snapshot: actorSnapshot,
      payload: { comment, step_role: pendingStep.role },
    };

    const outboxEvent: Partial<ApprovalOutboxEvent> = {
      event_type: 'ApprovalRejected',
      payload: { request: { ...request, ...updatedRequest }, history },
    };

    await ApprovalRepository.executeTransaction(
      [updatedRequest],
      [stepUpdate],
      [history],
      [outboxEvent],
    );
    OutboxWorker.processPendingEvents().catch(console.error);

    return { ...request, ...updatedRequest } as ApprovalRequest;
  }

  static async cancel(
    requestId: string,
    actorSnapshot: ApproverSnapshot,
    comment: string,
  ): Promise<ApprovalRequest> {
    const request = await ApprovalRepository.getRequestById(requestId);
    if (!request || request.status !== APPROVAL_STATUS.APPROVED)
      throw new Error(
        '[ApprovalEngine] Only approved requests can be cancelled.',
      );

    const updatedRequest: Partial<ApprovalRequest> = {
      id: request.id,
      status: APPROVAL_STATUS.CANCELLED,
      row_version: request.row_version + 1,
    };

    const history: Partial<ApprovalHistory> = {
      request_id: request.id,
      event_type: 'ApprovalCancelled',
      actor_snapshot: actorSnapshot,
      payload: { comment },
    };

    const outboxEvent: Partial<ApprovalOutboxEvent> = {
      event_type: 'ApprovalCancelled',
      payload: { request: { ...request, ...updatedRequest }, history },
    };

    await ApprovalRepository.executeTransaction(
      [updatedRequest],
      [],
      [history],
      [outboxEvent],
    );
    OutboxWorker.processPendingEvents().catch(console.error);

    return { ...request, ...updatedRequest } as ApprovalRequest;
  }

  static async delegate(
    requestId: string,
    currentRoles: string[],
    currentUserId: string,
    delegateeUserId: string,
    actorSnapshot: ApproverSnapshot,
    comment?: string,
  ): Promise<ApprovalRequest> {
    const request = await ApprovalRepository.getRequestById(requestId);
    if (!request || request.status !== APPROVAL_STATUS.PENDING)
      throw new Error('[ApprovalEngine] Request is not in pending state.');

    const steps = await ApprovalRepository.getStepsByRequestId(requestId);
    steps.sort((a, b) => a.step_order - b.step_order);

    const pendingSteps = steps.filter(
      (s) => s.status === APPROVAL_STATUS.PENDING,
    );
    const firstPendingStep = pendingSteps[0];
    if (!firstPendingStep)
      throw new Error('[ApprovalEngine] No pending steps found.');

    const currentStepOrder = firstPendingStep.step_order;
    const pendingStep = pendingSteps.find(
      (s) =>
        s.step_order === currentStepOrder &&
        (currentRoles.includes(s.role) ||
          s.delegated_to_user_id === currentUserId),
    );

    if (!pendingStep)
      throw new Error(
        '[ApprovalEngine] You do not have permission to delegate the current step.',
      );

    const stepUpdate: Partial<ApprovalStep> = {
      id: pendingStep.id,
      delegated_to_user_id: delegateeUserId,
    };

    const updatedRequest: Partial<ApprovalRequest> = {
      id: request.id,
      row_version: request.row_version + 1,
    };

    const history: Partial<ApprovalHistory> = {
      request_id: request.id,
      event_type: 'ApprovalDelegated',
      actor_snapshot: actorSnapshot,
      payload: {
        comment,
        step_role: pendingStep.role,
        delegated_to: delegateeUserId,
      },
    };

    const outboxEvent: Partial<ApprovalOutboxEvent> = {
      event_type: 'ApprovalDelegated',
      payload: { request: { ...request, ...updatedRequest }, history },
    };

    await ApprovalRepository.executeTransaction(
      [updatedRequest],
      [stepUpdate],
      [history],
      [outboxEvent],
    );
    OutboxWorker.processPendingEvents().catch(console.error);

    return { ...request, ...updatedRequest } as ApprovalRequest;
  }

  static async processEscalations(): Promise<void> {
    const { untypedDb } = await import('@/services/supabase/untyped');

    const { data: overdueSteps, error } = await untypedDb
      .from('approval_steps')
      .select('id, request_id, role, escalation_action, escalation_role')
      .eq('status', 'pending')
      .eq('is_overdue', false)
      .not('deadline', 'is', null)
      .lt('deadline', new Date().toISOString());

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[ApprovalEngine] Error fetching escalations:', error);
      return;
    }

    for (const step of overdueSteps || []) {
      const stepUpdate: Partial<ApprovalStep> = {
        id: step.id,
        is_overdue: true,
      };
      const systemActor: ApproverSnapshot = {
        id: 'system',
        name: 'Hệ thống (SLA)',
        role: 'system',
      };

      try {
        switch (step.escalation_action) {
          case 'auto_approve': {
            await this.approve(
              step.request_id,
              { ...systemActor, role: step.role },
              'Tự động duyệt do quá hạn SLA',
            );
            break;
          }
          case 'auto_reject': {
            await this.reject(
              step.request_id,
              { ...systemActor, role: step.role },
              'Tự động từ chối do quá hạn SLA',
            );
            break;
          }
          case 'escalate_role': {
            if (step.escalation_role) {
              stepUpdate.role = step.escalation_role;
              const request = await ApprovalRepository.getRequestById(
                step.request_id,
              );
              const history: Partial<ApprovalHistory> = {
                request_id: step.request_id,
                event_type: 'ApprovalEscalated',
                actor_snapshot: systemActor,
                payload: {
                  note: `Chuyển lên cấp ${step.escalation_role} do quá hạn`,
                },
              };
              const outboxEvent: Partial<ApprovalOutboxEvent> = {
                event_type: 'ApprovalEscalated',
                payload: { request, history },
              };
              await ApprovalRepository.executeTransaction(
                [],
                [stepUpdate],
                [history],
                [outboxEvent],
              );
              OutboxWorker.processPendingEvents().catch(console.error);
            }
            break;
          }
          case 'notify':
          default: {
            const request = await ApprovalRepository.getRequestById(
              step.request_id,
            );
            const history: Partial<ApprovalHistory> = {
              request_id: step.request_id,
              event_type: 'ApprovalSlaBreached',
              actor_snapshot: systemActor,
              payload: { note: 'Bước duyệt đã quá hạn SLA' },
            };
            const outboxEvent: Partial<ApprovalOutboxEvent> = {
              event_type: 'ApprovalSlaBreached',
              payload: { request, history },
            };
            await ApprovalRepository.executeTransaction(
              [],
              [stepUpdate],
              [history],
              [outboxEvent],
            );
            OutboxWorker.processPendingEvents().catch(console.error);
            break;
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
          `[ApprovalEngine] Failed to process escalation for step ${step.id}:`,
          err,
        );
      }
    }
  }
}
