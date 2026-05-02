/**
 * Media Manager — Module Registration
 *
 * Registers the Media Manager feature into the FeatureRegistry.
 * Provides both the FeaturePlugin (for routing/navigation) and
 * the FeatureDefinition (for the feature scaffold page).
 */

import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';

export const mediaFeature: FeatureDefinition = {
  key: 'media',
  route: '/media',
  title: 'Quản lý Media',
  badge: 'New',
  description:
    'Quản lý file, hình ảnh, tài liệu và video. Upload trực tiếp, tổ chức theo thư mục.',
  summary: [
    { label: 'Tổng file', value: '—' },
    { label: 'Dung lượng', value: '—' },
  ],
  highlights: [
    'Upload trực tiếp lên Storage (không qua proxy)',
    'Tổ chức file theo thư mục lồng nhau',
    'Phân tách bucket Public / Secure',
    'Hỗ trợ Signed URL cho file bảo mật',
    'Soft Delete - khôi phục file đã xoá',
  ],
  entities: ['media_assets', 'media_folders'],
  nextMilestones: [
    'Tạo thumbnail tự động cho ảnh sản phẩm',
    'Tích hợp Media Picker vào Rich Text Editor',
    'Nén ảnh tự động khi upload (browser-image-compression)',
  ],
};

export const mediaPlugin: FeaturePlugin = {
  key: 'media',
  route: 'media',
  label: 'Quản lý Media',
  shortLabel: 'Media',
  description: 'Quản lý file, hình ảnh, tài liệu đính kèm.',
  icon: 'Image',
  // No routeGuard so staff can access it if needed
  group: 'system',
  order: 85,
  routes: [
    {
      path: 'media',
      component: () =>
        import('./MediaManagerPage').then((m) => ({
          default: m.MediaManagerPage,
        })),
    },
  ],
};

export default createModule(mediaFeature);
