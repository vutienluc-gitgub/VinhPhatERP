/**
 * Workflow Engine — Core
 *
 * API trung tâm: validate transition, lấy danh sách next states,
 * kiểm tra trạng thái terminal.
 */
import type {
  TransitionContext,
  TransitionResult,
  TransitionRule,
  WorkflowConfig,
} from './types';

const registry = new Map<string, WorkflowConfig>();

/**
 * Đăng ký một workflow config vào registry.
 * Gọi 1 lần khi app khởi tạo (hoặc khi import config file).
 */
export function registerWorkflow(config: WorkflowConfig): void {
  registry.set(config.entity, config);
}

/**
 * Lấy workflow config theo entity name.
 */
export function getWorkflow(entity: string): WorkflowConfig | undefined {
  return registry.get(entity);
}

/**
 * Validate một transition: from → to, có kèm metadata context.
 *
 * Trả về { ok: true } nếu hợp lệ, { ok: false, reason } nếu bị chặn.
 */
export function validateTransition(
  entity: string,
  context: TransitionContext,
): TransitionResult {
  const config = registry.get(entity);
  if (!config) {
    return { ok: false, reason: `Workflow '${entity}' chưa được đăng ký` };
  }

  const { currentStatus, targetStatus } = context;

  // Same status → always ok (no-op)
  if (currentStatus === targetStatus) {
    return { ok: true };
  }

  // Terminal status → cannot transition out
  if (config.terminalStatuses?.includes(currentStatus)) {
    return {
      ok: false,
      reason: `Trạng thái '${currentStatus}' là trạng thái cuối, không thể chuyển đổi`,
    };
  }

  // Find matching rule
  const rule = findTransitionRule(
    config.transitions,
    currentStatus,
    targetStatus,
  );
  if (!rule) {
    return {
      ok: false,
      reason: `Không cho phép chuyển từ '${currentStatus}' sang '${targetStatus}'`,
    };
  }

  // Run guard if exists
  if (rule.guard) {
    return rule.guard(context);
  }

  return { ok: true };
}

/**
 * Kiểm tra nhanh: có thể chuyển từ from → to không (không cần context đầy đủ).
 */
export function canTransition(
  entity: string,
  from: string,
  to: string,
  metadata: Record<string, unknown> = {},
): boolean {
  const result = validateTransition(entity, {
    entityId: '',
    currentStatus: from,
    targetStatus: to,
    metadata,
  });
  return result.ok;
}

/**
 * Lấy danh sách trạng thái có thể chuyển đến từ status hiện tại.
 * Dùng cho UI: hiển thị dropdown chọn trạng thái tiếp theo.
 */
export function getNextStatuses(
  entity: string,
  currentStatus: string,
): string[] {
  const config = registry.get(entity);
  if (!config) return [];

  if (config.terminalStatuses?.includes(currentStatus)) {
    return [];
  }

  const targets = new Set<string>();
  for (const rule of config.transitions) {
    if (rule.from === currentStatus) {
      targets.add(rule.to);
    }
  }
  return Array.from(targets);
}

/**
 * Lấy danh sách trạng thái có thể chuyển đến, đã validate qua guard.
 */
export function getAvailableTransitions(
  entity: string,
  context: Omit<TransitionContext, 'targetStatus'>,
): Array<{ status: string; label?: string }> {
  const config = registry.get(entity);
  if (!config) return [];

  const { currentStatus } = context;
  if (config.terminalStatuses?.includes(currentStatus)) {
    return [];
  }

  const results: Array<{ status: string; label?: string }> = [];

  for (const rule of config.transitions) {
    if (rule.from !== currentStatus) continue;

    const fullContext: TransitionContext = {
      ...context,
      targetStatus: rule.to,
    };

    const validation = rule.guard ? rule.guard(fullContext) : { ok: true };
    if (validation.ok) {
      results.push({ status: rule.to, label: rule.label });
    }
  }

  return results;
}

// ── Internal helpers ──

function findTransitionRule(
  rules: TransitionRule[],
  from: string,
  to: string,
): TransitionRule | undefined {
  return rules.find((r) => r.from === from && r.to === to);
}
