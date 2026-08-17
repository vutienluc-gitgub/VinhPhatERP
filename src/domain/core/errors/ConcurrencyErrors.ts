/**
 * Domain Error Taxonomy for Concurrency and State Transitions.
 * Pure TypeScript — no React or Supabase dependencies.
 */

export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * ConcurrencyConflictError (OCC Mismatch)
 * Thrown when a record has been modified by another user concurrently.
 */
export class ConcurrencyConflictError extends DomainError {
  readonly code = 'CONCURRENCY_CONFLICT';

  constructor(
    message = 'Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại trang để xem nội dung mới nhất.',
  ) {
    super(message);
  }
}

/**
 * InvalidStateTransitionError
 * Thrown when a workflow transition is requested from an invalid source state,
 * or when a concurrent action has already changed the state.
 */
export class InvalidStateTransitionError extends DomainError {
  readonly code = 'INVALID_STATE_TRANSITION';
  readonly fromStatus?: string;
  readonly targetTransition?: string;

  constructor(
    fromStatus?: string,
    targetTransition?: string,
    message?: string,
  ) {
    const defaultMsg =
      fromStatus && targetTransition
        ? `Không thể thực hiện thao tác "${targetTransition}" vì bản ghi hiện không ở trạng thái "${fromStatus}" (hoặc đã được xử lý bởi người khác).`
        : 'Thao tác chuyển trạng thái không hợp lệ hoặc bản ghi đã được xử lý bởi người khác. Vui lòng tải lại trang.';
    super(message || defaultMsg);
    this.fromStatus = fromStatus;
    this.targetTransition = targetTransition;
  }
}

/**
 * RecordNotFoundError
 * Thrown when an expected entity does not exist or has been deleted.
 */
export class RecordNotFoundError extends DomainError {
  readonly code = 'RECORD_NOT_FOUND';

  constructor(message = 'Bản ghi không tồn tại hoặc đã bị xóa.') {
    super(message);
  }
}

/**
 * TerminalStateError
 * Thrown when attempting an update or action on a terminal entity (e.g. cancelled/completed).
 */
export class TerminalStateError extends DomainError {
  readonly code = 'TERMINAL_STATE';

  constructor(status: string, message?: string) {
    super(
      message ||
        `Bản ghi đang ở trạng thái kết thúc ("${status}") và không thể chỉnh sửa thêm.`,
    );
  }
}
