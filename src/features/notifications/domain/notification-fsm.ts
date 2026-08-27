export type NotificationFsmState =
  | 'UNKNOWN'
  | 'CHECKING'
  | 'UNSUPPORTED'
  | 'PERMISSION_REQUIRED'
  | 'REQUESTING'
  | 'DENIED'
  | 'SUBSCRIBING'
  | 'ACTIVE'
  | 'FAILED';

export interface NotificationFsmContext {
  state: NotificationFsmState;
  permission: NotificationPermission;
  isSupported: boolean;
  isStandalone: boolean;
  isSubscribed: boolean;
  errorMessage?: string;
}

export class NotificationFsm {
  /**
   * Derives current FSM state from environment and permission flags
   */
  static deriveState(params: {
    isSupported: boolean;
    permission: NotificationPermission;
    isSubscribed: boolean;
    isLoading?: boolean;
    isRequestingPermission?: boolean;
    error?: string;
  }): NotificationFsmState {
    if (!params.isSupported) {
      return 'UNSUPPORTED';
    }

    if (params.isRequestingPermission) {
      return 'REQUESTING';
    }

    if (params.isLoading) {
      return 'SUBSCRIBING';
    }

    if (params.error) {
      return 'FAILED';
    }

    if (params.permission === 'denied') {
      return 'DENIED';
    }

    if (params.isSubscribed && params.permission === 'granted') {
      return 'ACTIVE';
    }

    return 'PERMISSION_REQUIRED';
  }

  /**
   * Human readable status label in Vietnamese
   */
  static getStatusLabel(state: NotificationFsmState): string {
    switch (state) {
      case 'ACTIVE':
        return 'Đang hoạt động trên thiết bị này';
      case 'PERMISSION_REQUIRED':
        return 'Chưa kích hoạt trên thiết bị này';
      case 'DENIED':
        return 'Đã bị chặn trong cài đặt thiết bị';
      case 'UNSUPPORTED':
        return 'Thiết bị chưa hỗ trợ thông báo đẩy';
      case 'REQUESTING':
        return 'Đang chờ cấp quyền...';
      case 'SUBSCRIBING':
        return 'Đang đăng ký thiết bị...';
      case 'CHECKING':
        return 'Đang kiểm tra thiết bị...';
      case 'FAILED':
        return 'Cần thiết lập lại';
      default:
        return 'Chưa xác định';
    }
  }

  /**
   * Status theme variant for UI badges ('success' | 'warning' | 'danger' | 'muted')
   */
  static getStatusVariant(
    state: NotificationFsmState,
  ): 'success' | 'warning' | 'danger' | 'muted' {
    switch (state) {
      case 'ACTIVE':
        return 'success';
      case 'PERMISSION_REQUIRED':
        return 'muted';
      case 'DENIED':
      case 'FAILED':
        return 'danger';
      case 'REQUESTING':
      case 'SUBSCRIBING':
      case 'CHECKING':
        return 'warning';
      case 'UNSUPPORTED':
      default:
        return 'muted';
    }
  }
}
