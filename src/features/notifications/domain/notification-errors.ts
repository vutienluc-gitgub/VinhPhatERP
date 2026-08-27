/**
 * Base Notification Error class
 */
export abstract class NotificationError extends Error {
  abstract readonly code: string;
  abstract readonly userMessage: string;

  constructor(
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BrowserNotSupportedError extends NotificationError {
  readonly code = 'BROWSER_NOT_SUPPORTED';
  readonly userMessage =
    'Trình duyệt hoặc thiết bị này chưa hỗ trợ tính năng thông báo đẩy.';
}

export class IOSStandaloneRequiredError extends NotificationError {
  readonly code = 'IOS_STANDALONE_REQUIRED';
  readonly userMessage =
    'Trên iPhone/iPad, vui lòng thêm ứng dụng vào Màn hình chính (Add to Home Screen) để nhận thông báo và hiện số đếm đỏ.';
}

export class PermissionDeniedError extends NotificationError {
  readonly code = 'PERMISSION_DENIED';
  readonly userMessage =
    'Bạn đã từ chối cấp quyền thông báo. Vui lòng mở Cài đặt trình duyệt/thiết bị để cho phép nhận thông báo.';
}

export class PermissionDismissedError extends NotificationError {
  readonly code = 'PERMISSION_DISMISSED';
  readonly userMessage =
    'Yêu cầu cấp quyền thông báo chưa được xác nhận. Vui lòng nhấn Cho phép khi hộp thoại xuất hiện.';
}

export class InvalidVapidPublicKeyError extends NotificationError {
  readonly code = 'INVALID_VAPID_PUBLIC_KEY';
  readonly userMessage =
    'Cấu hình thông báo máy chủ chưa sẵn sàng. Vui lòng liên hệ quản trị viên hệ thống.';
}

export class ServiceWorkerNotReadyError extends NotificationError {
  readonly code = 'SERVICE_WORKER_NOT_READY';
  readonly userMessage =
    'Dịch vụ thông báo nền (Service Worker) đang khởi động. Vui lòng tải lại trang và thử lại.';
}

export class PushSubscriptionFailedError extends NotificationError {
  readonly code = 'PUSH_SUBSCRIPTION_FAILED';
  readonly userMessage =
    'Không thể kết nối cổng thông báo đẩy của thiết bị. Vui lòng kiểm tra lại kết nối mạng.';
}

export class BackendRegistrationError extends NotificationError {
  readonly code = 'BACKEND_REGISTRATION_FAILED';
  readonly userMessage =
    'Không thể đồng bộ thiết bị với máy chủ ERP. Vui lòng thử lại sau.';
}

export class UserNotAuthenticatedError extends NotificationError {
  readonly code = 'USER_NOT_AUTHENTICATED';
  readonly userMessage = 'Vui lòng đăng nhập để quản lý thông báo.';
}

/**
 * Maps any unknown error to a typed NotificationError
 */
export function mapToNotificationError(err: unknown): NotificationError {
  if (err instanceof NotificationError) {
    return err;
  }

  const message = err instanceof Error ? err.message : String(err);

  if (message.includes('P-256') || message.includes('applicationServerKey')) {
    return new InvalidVapidPublicKeyError(message, err);
  }

  if (message.includes('denied') || message.includes('permission')) {
    return new PermissionDeniedError(message, err);
  }

  if (message.includes('Service Worker') || message.includes('serviceWorker')) {
    return new ServiceWorkerNotReadyError(message, err);
  }

  return new PushSubscriptionFailedError(message, err);
}
