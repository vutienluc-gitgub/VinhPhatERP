import { TaskStatus, TaskPriority } from './types';

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'Đang làm',
  blocked: 'Bị chặn',
  review: 'Review',
  done: 'Hoàn thành',
  cancelled: 'Hủy bỏ',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Thấp',
  normal: 'Bình thường',
  high: 'Cao',
  urgent: 'Khẩn cấp',
};

export const OPERATIONS_MESSAGES = {
  INIT_SPACE: 'Đang khởi tạo không gian vận hành...',
  DRAG_HERE: 'Kéo task vào đây',
  TITLE: 'Vận hành & Task',
  SUBTITLE: 'Hệ thống quản trị Kanban & Hiệu suất tức thời',
  SEARCH_PLACEHOLDER: 'Tìm kiếm công việc...',
  FILTER_ASSIGNEE: 'Lọc nhân viên',
  CREATE_TASK: 'Tạo Task',
  ALL_PERSONNEL: 'Tất cả nhân sự',
  TASK_DETAILS: 'Chi tiết công việc',
  INIT_TASK: 'Khởi tạo nhiệm vụ',
  SAVE_SUCCESS: 'Lưu task thành công',
  UPDATE_SUCCESS: 'Cập nhật task thành công',
  DELETE_SUCCESS: 'Xóa task thành công',
  SAVE_ERROR: 'Có lỗi xảy ra khi lưu task',
  DELETE_ERROR: 'Có lỗi xảy ra khi xóa task',
  DELETE_CONFIRM: 'Bạn có chắc chắn muốn xóa task này?',
  SYSTEM: 'Hệ thống',
  TOTAL_TASK: 'Tổng task',
  COMPLETED: 'Hoàn thành',
  OVERDUE: 'Quá hạn',
  EFFICIENCY: 'Hiệu suất',
  CANNOT_MOVE_TASK: 'Không thể chuyển task:',
  TEAM_WORKLOAD: 'Tải trọng đội ngũ',
  LIVE_ACTIVITY: 'Hoạt động tức thời',
  LIVE: 'Trực tiếp',
  TASK: 'task',
};
