import { useEffect } from 'react';

import type { FabricCatalog } from '@/domain/settings/fabric-catalog.types';
import { PUBLIC_PAGE_LABELS as LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';

export function useFabricSeo(
  fabric: Partial<FabricCatalog> | null | undefined,
) {
  useEffect(() => {
    if (fabric) {
      document.title = `${fabric.name} | ${LABELS.brandName}`;

      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute(
        'content',
        `${fabric.name} (${fabric.code}) - ${fabric.composition || ''}. Khổ ${fabric.target_width_cm || ''}cm, định lượng ${fabric.target_gsm || ''}gsm.`,
      );

      const ogTags = {
        'og:title': `${fabric.code} | ${fabric.name}`,
        'og:description': `Thành phần: ${fabric.composition || 'N/A'}. Khổ chuẩn: ${fabric.target_width_cm || ''}cm. Xem chi tiết bảng màu và thông tin MOQ/Lead time trực tuyến.`,
        'og:image': fabric.image_url || '',
        'og:url': window.location.href,
        'og:type': 'product',
      };

      Object.entries(ogTags).forEach(([property, content]) => {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      });
    }
  }, [fabric]);
}
