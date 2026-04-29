/**
 * Workflow Engine — Public API
 *
 * Import duy nhất: import { validateTransition, canTransition, ... } from '@/lib/workflow-engine';
 *
 * Auto-registers tất cả workflow configs khi module được import lần đầu.
 */
export {
  registerWorkflow,
  getWorkflow,
  validateTransition,
  canTransition,
  getNextStatuses,
  getAvailableTransitions,
} from './engine';

export type {
  TransitionResult,
  TransitionContext,
  TransitionRule,
  WorkflowConfig,
} from './types';

// ── Auto-register all workflow configs ──
import { registerWorkflow } from './engine';
import { workOrderWorkflow } from './configs/work-order.workflow';
import { opsTaskWorkflow } from './configs/ops-task.workflow';
import { orderStageWorkflow } from './configs/order-stage.workflow';

registerWorkflow(workOrderWorkflow);
registerWorkflow(opsTaskWorkflow);
registerWorkflow(orderStageWorkflow);
