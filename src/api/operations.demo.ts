export const demoEmployees = [
  {
    id: 'e1',
    name: 'Nguyễn Văn A',
    code: 'NV001',
    phone: '0901234567',
    status: 'active',
  },
  {
    id: 'e6',
    name: 'Đỗ Quỳnh F',
    code: 'NV006',
    phone: '0901234568',
    status: 'active',
  },
  {
    id: 'e8',
    name: 'Nguyễn Hải H',
    code: 'NV008',
    phone: '0901234569',
    status: 'active',
  },
  {
    id: 'e9',
    name: 'Trần Nam I',
    code: 'NV009',
    phone: '0901234570',
    status: 'active',
  },
  {
    id: 'e10',
    name: 'Lý Hoa K',
    code: 'NV010',
    phone: '0901234571',
    status: 'active',
  },
  {
    id: 'e11',
    name: 'Phạm Tú L',
    code: 'NV011',
    phone: '0901234572',
    status: 'active',
  },
  {
    id: 'e13',
    name: 'Vũ Thanh G',
    code: 'NV013',
    phone: '0901234573',
    status: 'active',
  },
];

export const demoKpis = [
  { id: 'k10', code: 'SAL.CLOSE', name: 'Sales close rate', unit: '%' },
  { id: 'k30', code: 'OPS.SLA', name: 'Order SLA', unit: '%' },
  {
    id: 'k101',
    code: 'E8.CLOSE',
    name: 'Sales close / Nguyễn Hải H',
    unit: 'đơn',
  },
  { id: 'k201', code: 'E10.CONTENT', name: 'Content output', unit: 'bài' },
];

export const demoTasks = [
  {
    id: 't1',
    title: 'Chốt 10 đơn sales tuần này',
    assignee_id: 'e8',
    status: 'in_progress',
    priority: 'high',
    due_date: '2026-04-30',
  },
  {
    id: 't2',
    title: 'Gọi 50 leads warm',
    assignee_id: 'e9',
    status: 'todo',
    priority: 'high',
    due_date: '2026-04-30',
  },
  {
    id: 't3',
    title: 'Đăng 15 bài content TikTok',
    assignee_id: 'e10',
    status: 'in_progress',
    priority: 'normal',
    due_date: '2026-04-30',
  },
  {
    id: 't5',
    title: 'Review SLA vận hành tháng',
    assignee_id: 'e6',
    status: 'review',
    priority: 'normal',
    due_date: '2026-04-30',
  },
  {
    id: 't10',
    title: 'Thiết kế landing page mới',
    assignee_id: 'e10',
    status: 'blocked',
    priority: 'normal',
    due_date: '2026-04-30',
  },
];

export const demoActivities = [
  {
    id: '1',
    actor: 'Nguyễn Hải H',
    action: 'chuyển task sang Review',
    time: '5 phút trước',
    avatarColor: 'bg-indigo-600',
  },
  {
    id: '2',
    actor: 'Lý Hoa K',
    action: "hoàn thành 'Đăng 15 bài content'",
    time: '30 phút trước',
    avatarColor: 'bg-emerald-600',
  },
  {
    id: '3',
    actor: 'Phạm Tú L',
    action: "block task 'Tối ưu ads Q2'",
    time: '2 giờ trước',
    avatarColor: 'bg-red-500',
  },
  {
    id: '4',
    actor: 'Đỗ Quỳnh F',
    action: 'bắt đầu review SLA vận hành',
    time: 'hôm qua',
    avatarColor: 'bg-violet-600',
  },
];
