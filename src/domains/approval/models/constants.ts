export const APPROVAL_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

export type ApprovalStatus =
  (typeof APPROVAL_STATUS)[keyof typeof APPROVAL_STATUS];

export const APPROVAL_STATUS_VI = {
  [APPROVAL_STATUS.DRAFT]: 'Nháp',
  [APPROVAL_STATUS.PENDING]: 'Chờ duyệt',
  [APPROVAL_STATUS.APPROVED]: 'Đã duyệt',
  [APPROVAL_STATUS.REJECTED]: 'Từ chối',
  [APPROVAL_STATUS.CANCELLED]: 'Đã hủy',
} as const;
