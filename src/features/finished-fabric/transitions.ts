import type { RollStatus } from './types';

/**
 * Cuộn có thể được chỉnh sửa không?
 * - `shipped`: đã cam kết với phiếu xuất kho — khóa vĩnh viễn
 * - `written_off`: đã xóa sổ — khóa vĩnh viễn
 */
export function canEditRoll(status: RollStatus): boolean {
  return status !== 'shipped' && status !== 'written_off';
}

/**
 * Cuộn có thể bị xóa không?
 * Chỉ xóa được khi chưa liên quan đến bất kỳ giao dịch nào.
 * - `in_stock`, `in_process`: được xóa
 * - Tất cả trạng thái còn lại: không được xóa
 */
export function canDeleteRoll(status: RollStatus): boolean {
  return status === 'in_stock' || status === 'in_process';
}

/**
 * Lý do không thể chỉnh sửa. Trả về `null` nếu được phép sửa.
 */
export function editBlockReason(status: RollStatus): string | null {
  if (status === 'shipped') return 'Cuộn đã xuất kho — không thể chỉnh sửa';
  if (status === 'written_off') return 'Cuộn đã xóa sổ — không thể chỉnh sửa';
  return null;
}

/**
 * Lý do không thể xóa. Trả về `null` nếu được phép xóa.
 */
export function deleteBlockReason(status: RollStatus): string | null {
  if (status === 'shipped') return 'Cuộn đã xuất kho — không thể xóa';
  if (status === 'reserved') return 'Cuộn đang được đặt trước — không thể xóa';
  if (status === 'damaged')
    return 'Cuộn hư hỏng — không thể xóa, hãy giữ để kiểm tra';
  if (status === 'written_off') return 'Cuộn đã xóa sổ — không thể xóa';
  return null;
}

/**
 * Danh sách trạng thái được phép chuyển sang từ trạng thái hiện tại.
 * Dùng để giới hạn lựa chọn trong status select khi edit.
 */
export function getAllowedStatusTransitions(
  currentStatus: RollStatus,
): RollStatus[] {
  switch (currentStatus) {
    case 'in_stock':
      return ['in_stock', 'reserved', 'in_process', 'damaged', 'written_off'];
    case 'reserved':
      // Chỉ có thể unreserve thủ công hoặc ghi nhận hư hỏng; không nhảy thẳng sang shipped
      return ['reserved', 'in_stock', 'damaged', 'written_off'];
    case 'in_process':
      return ['in_process', 'in_stock', 'damaged', 'written_off'];
    case 'damaged':
      return ['damaged', 'written_off'];
    case 'shipped':
      // Terminal — không thể thay đổi
      return ['shipped'];
    case 'written_off':
      // Terminal — không thể thay đổi
      return ['written_off'];
    default:
      return ['in_stock'];
  }
}
