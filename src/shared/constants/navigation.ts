/**
 * Navigation group constants — Nguồn sự thật duy nhất cho Sidebar và MobileDrawer.
 *
 * Khi thêm/sửa nhóm, chỉ cần sửa TẠI ĐÂY, toàn bộ hệ thống tự đồng bộ.
 */

export const GROUP_LABELS: Record<string, { label: string; icon: string }> = {
  sales: {
    label: 'Kinh doanh',
    icon: 'Briefcase',
  },
  production: {
    label: 'Sản xuất',
    icon: 'Factory',
  },
  warehouse: {
    label: 'Kho vận',
    icon: 'Warehouse',
  },
  finance: {
    label: 'Tài chính',
    icon: 'Landmark',
  },
  'master-data': {
    label: 'Danh mục',
    icon: 'Database',
  },
  system: {
    label: 'Hệ thống',
    icon: 'Shield',
  },
};

export const GROUP_ORDER = [
  'sales',
  'production',
  'warehouse',
  'finance',
  'master-data',
  'system',
];

/** Flat label map cho MobileMoreDrawer (chỉ cần tên, không cần icon) */
export const GROUP_LABEL_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(GROUP_LABELS).map(([key, meta]) => [key, meta.label]),
);

/**
 * Nhóm mặc định được MỞ cho từng role.
 * Nhóm không có trong mảng → thu gọn mặc định (user vẫn bấm mở được).
 */
export const ROLE_DEFAULT_GROUPS: Record<string, string[]> = {
  admin: [
    'sales',
    'production',
    'warehouse',
    'finance',
    'master-data',
    'system',
  ],
  manager: ['sales', 'production', 'warehouse', 'finance'],
  staff: ['production', 'warehouse'],
  sale: ['sales'],
  driver: ['warehouse'],
  viewer: ['finance'],
  customer: [],
};

/**
 * Tính trạng thái thu gọn mặc định dựa trên role.
 * Trả về Record<string, boolean> trong đó true = nhóm bị thu gọn.
 */
export function getDefaultCollapsedByRole(
  role: string | undefined,
): Record<string, boolean> {
  if (!role) return {};
  const expandedGroups = ROLE_DEFAULT_GROUPS[role] ?? [];
  const result: Record<string, boolean> = {};
  for (const group of GROUP_ORDER) {
    if (!expandedGroups.includes(group)) {
      result[group] = true;
    }
  }
  return result;
}
