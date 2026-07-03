import { useEffect } from 'react';
import toast from 'react-hot-toast';

import type { FabricCatalog } from '@/domain/settings/fabric-catalog.types';
import { useWishlist } from '@/shared/wishlist';
import { PUBLIC_PAGE_LABELS as LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';
import { useRFQ } from '@/features/fabric-catalog/hooks/useRFQ';

export function useFabricInteractions(
  fabric: Partial<FabricCatalog> | null | undefined,
  activeColorName: string | null,
) {
  const { wishlist, addToWishlist, removeFromWishlist, addRecentlyViewed } =
    useWishlist();
  const { openRFQ, openSample } = useRFQ();

  const isSaved = fabric?.id
    ? Object.keys(wishlist).includes(fabric.id)
    : false;

  const handleToggleWishlist = () => {
    if (!fabric) return;

    if (isSaved) {
      removeFromWishlist(fabric.id ?? '');
      toast.success(LABELS.unwishlistSuccess);
    } else {
      addToWishlist({
        id: fabric.id ?? '',
        code: fabric.code ?? '',
        name: fabric.name ?? '',
        image_url: fabric.image_url ?? undefined,
        color_name: activeColorName ?? undefined,
      });
      toast.success(LABELS.wishlistSuccess);
    }
  };

  const handleCTAAction = (
    action: 'rfq' | 'sample' | 'call' | 'order' | 'erp',
  ) => {
    if (action === 'rfq') {
      openRFQ({ leadSource: 'sticky_cta', leadChannel: 'website' });
    } else if (action === 'sample') {
      openSample({ leadSource: 'sticky_cta', leadChannel: 'website' });
    }
    // 'call', 'order', 'erp' are handled directly in FabricStickyCTA via href/tel
  };

  // Track recently viewed history side-effect
  useEffect(() => {
    if (fabric?.id) {
      addRecentlyViewed(fabric.id);
    }
  }, [fabric?.id, addRecentlyViewed]);

  return {
    wishlist,
    isSaved,
    removeFromWishlist,
    handleToggleWishlist,
    handleCTAAction,
    openRFQ,
    openSample,
  };
}
