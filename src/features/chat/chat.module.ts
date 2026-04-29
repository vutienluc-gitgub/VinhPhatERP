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
  description: 'Hệ thống Chat nội bộ đa thực thể.',
  icon: 'MessageCircle', // Thay thế bằng icon phù hợp
  requiredRoles: ['admin', 'driver', 'customer', 'staff', 'manager'],
  group: 'system',
  routes: [], // Chat là một global widget, không cần route riêng biệt
};

export default createModule(chatFeature);
