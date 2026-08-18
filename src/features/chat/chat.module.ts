import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';

export const chatFeature: FeatureDefinition = {
  key: 'chat',
  route: '',
  title: 'Hệ thống Chat nội bộ',
  badge: 'Chat',
  description:
    'Cung cấp chức năng trao đổi tin nhắn thời gian thực giữa các bên liên quan trong từng thực thể (đơn hàng, chuyến hàng, v.v.).',
  summary: [
    {
      label: 'Phòng chat',
      value: 'Đa thực thể',
    },
    {
      label: 'Tính năng',
      value: 'Realtime, Offline Sync',
    },
  ],
  highlights: [
    'Hỗ trợ đính kèm hình ảnh.',
    'Thông báo real-time qua WebSockets.',
    'Đồng bộ tin nhắn ngoại tuyến.',
  ],
  entities: ['chat_messages', 'chat_rooms', 'chat_room_participants'],
  nextMilestones: ['Tích hợp bot tự động phản hồi.'],
};

export const chatPlugin: FeaturePlugin = {
  key: 'chat',
  route: '',
  label: 'Chat',
  shortLabel: 'Chat',
  description: 'He thong Chat noi bo da thuc the.',
  icon: 'MessageCircle',
  group: 'system',
  order: 92,
  requiredRoles: ['admin', 'driver', 'customer', 'staff', 'manager'],
  routes: [
    {
      path: '/feed',
      component: () =>
        import('./UnifiedFeedPage').then((m) => ({
          default: m.UnifiedFeedPage,
        })),
    },
  ],
};

export default createModule(chatFeature);
