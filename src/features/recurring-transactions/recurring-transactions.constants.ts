import type { BadgeVariant } from '@/shared/components/Badge';
import type { RecurringFrequency } from '@/domain/recurring-transactions/types';
import type { RecurringStatus } from '@/domain/recurring-transactions';

/** Human-readable labels for recurring frequencies. */
export const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  monthly: 'Hàng tháng',
  quarterly: 'Hàng quý',
  yearly: 'Hàng năm',
};

/** Frequency options for Combobox/select inputs. */
export const FREQUENCY_OPTIONS = (
  ['monthly', 'quarterly', 'yearly'] as const
).map((f) => ({
  value: f,
  label: FREQUENCY_LABELS[f],
}));

/** Badge mapping for recurring transaction status. */
export const RECURRING_STATUS_BADGE: Record<
  RecurringStatus,
  { label: string; variant: BadgeVariant }
> = {
  active: { label: 'Hoạt động', variant: 'success' },
  paused: { label: 'Tạm dừng', variant: 'gray' },
  overdue: { label: 'Quá hạn', variant: 'danger' },
};

/** Labels for the recurring transactions module. */
export const RECURRING_LABELS = {
  pageTitle: 'Nghiệp vụ định kỳ',
  createTitle: 'Tạo nghiệp vụ định kỳ',
  editTitle: 'Sửa nghiệp vụ định kỳ',
  emptyTitle: 'Chưa có nghiệp vụ định kỳ nào',
  emptyDescription:
    'Tạo nghiệp vụ định kỳ để tự động phát sinh phiếu chi hàng tháng cho thuê kho, lương nhân viên.',
  emptyAction: '+ Thêm nghiệp vụ định kỳ',
  addButton: 'Thêm mới',
  generateButton: 'Tạo phiếu chi đến hạn',
  generatingButton: 'Đang tạo...',
  generateSuccess: (count: number) => `Đã tạo ${count} phiếu chi thành công.`,
  generateNone: 'Không có nghiệp vụ nào đến hạn.',
  deleteConfirm: (name: string) =>
    `Xoá nghiệp vụ định kỳ "${name}"? Các phiếu chi đã tạo trước đó sẽ không bị ảnh hưởng.`,
  errorPrefix: 'Lỗi',
  errorLoadData: 'Lỗi tải dữ liệu',
  // Form labels
  formCancel: 'Hủy',
  formSaving: 'Đang lưu...',
  formUpdate: 'Cập nhật',
  formCreate: 'Tạo nghiệp vụ',
  formErrorPrefix: 'Lỗi',
  // Action labels
  actionPause: 'Tạm dừng',
  actionActivate: 'Kích hoạt',
  actionPauseShort: 'Dừng',
  actionActivateShort: 'Bật',
  actionEdit: 'Sửa',
  actionDelete: 'Xóa',
  // Table headers
  headerName: 'Nghiệp vụ',
  headerCategory: 'Danh mục',
  headerAmount: 'Số tiền',
  headerFrequency: 'Tần suất',
  headerNextDate: 'Ngày tiếp theo',
  headerTarget: 'Đối tượng',
  headerActions: 'Thao tác',
  // Info labels
  lastGenerated: 'Lần cuối',
  nextLabel: 'Tiếp',
  dayPrefix: 'Ngày',
  supplierPrefix: 'NCC',
  employeePrefix: 'NV',
} as const;

/** Day of month options (1-31). */
export const DAY_OF_MONTH_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: `Ngày ${i + 1}`,
}));
